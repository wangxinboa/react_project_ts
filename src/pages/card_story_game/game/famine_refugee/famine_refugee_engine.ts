import { evaluateFormula } from "../../formula/formula_eval.ts";
import type { AttributeValue, CardType, TargetRef } from "../../card_story_game_types/index.ts";
import { getNumberAttribute, getNumberValues, getStringAttribute, getStringListAttribute } from "./attribute_value.ts";
import type {
	ActionSlot,
	AttributeCheck,
	CardDerived,
	CardState,
	Condition,
	EffectCall,
	EffectDefinition,
	FamineAction,
	FamineRefugeeConfig,
	FamineState,
	FamineTag,
	FamineTemplate,
	InlineEffect,
	SaveCard,
	TagInstanceState,
} from "./famine_refugee_types.ts";

const MAX_LOGS = 30;

interface EntitySnapshot {
	values: Record<number, AttributeValue>;
	tagIds: Set<number>;
	templateId?: number;
	cardType?: CardType;
	cardId?: string;
}

interface ConditionContext {
	sourceCard?: EntitySnapshot;
	sourceTag?: EntitySnapshot;
	targetCard?: EntitySnapshot;
	host?: EntitySnapshot;
	slot?: EntitySnapshot;
	referencedCard?: EntitySnapshot;
	cards?: CardState[];
	config?: FamineRefugeeConfig;
}

function snapshotFromDerived(derived: CardDerived, card?: CardState): EntitySnapshot {
	return {
		values: card ? { ...card.values, ...derived.values } : derived.values,
		tagIds: new Set(derived.tagIds),
		templateId: derived.template.id,
		cardType: derived.template.cardType,
		cardId: card?.id,
	};
}

function snapshotFromTag(tag: TagInstanceState): EntitySnapshot {
	return { values: tag.values, tagIds: new Set<number>() };
}

function getAttributeId(config: FamineRefugeeConfig, key: string): number {
	for (let i = 0; i < config.allAttributes.length; i++) {
		if (config.allAttributes[i].key === key) return config.allAttributes[i].id;
	}
	return 0;
}

function getTemplate(config: FamineRefugeeConfig, id: number): FamineTemplate {
	for (let i = 0; i < config.cardTemplates.length; i++) {
		if (config.cardTemplates[i].id === id) return config.cardTemplates[i];
	}
	return config.cardTemplates[0];
}


function getTagDefinition(config: FamineRefugeeConfig, tagId: number): FamineTag | null {
	for (let i = 0; i < config.allTags.length; i++) {
		if (config.allTags[i].id === tagId) return config.allTags[i];
	}
	return null;
}

function createTagInstance(config: FamineRefugeeConfig, tagId: number): TagInstanceState {
	const definition = getTagDefinition(config, tagId);
	const values: Record<number, number> = {};
	if (definition?.attributes) {
		for (let i = 0; i < definition.attributes.length; i++) {
			const binding = definition.attributes[i];
			if (typeof binding.value === "number") values[binding.id] = binding.value;
		}
	}
	return { tagId, values };
}

function matchesAttribute(actual: number, check: AttributeCheck): boolean {
	if (typeof check.gt === "number" && !(actual > check.gt)) return false;
	if (typeof check.gte === "number" && !(actual >= check.gte)) return false;
	if (typeof check.lt === "number" && !(actual < check.lt)) return false;
	if (typeof check.lte === "number" && !(actual <= check.lte)) return false;
	if (typeof check.eq === "number" && actual !== check.eq) return false;
	return true;
}

function resolveTargetEntity(target: TargetRef, context: ConditionContext): EntitySnapshot | undefined {
	if (target.card === "sourceCard") return context.sourceCard;
	if (target.card === "sourceTag") return context.sourceTag;
	if (target.card === "targetCard") return context.targetCard;
	if (target.card === "host") return context.host;
	if (target.card === "referencedCard") return context.referencedCard;
	return context.slot;
}

function evaluateAttributeChecks(condition: Condition, entity: EntitySnapshot, context: ConditionContext): boolean {
	if (condition.attributes) {
		for (let i = 0; i < condition.attributes.length; i++) {
			const check = condition.attributes[i];
			const ids = [check.id, check.refId, check.refListId].filter((id): id is number => typeof id === "number");
			if (ids.length !== 1) return false;
			const attributeId = ids[0];
			const value = entity.values[attributeId];
			if (typeof check.refExists === "boolean") {
				const exists = value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0);
				if (exists !== check.refExists) return false;
				continue;
			}
			if (check.refListsMatch) {
				if (!Array.isArray(value) || !context.config) return false;
				const cards = context.cards ?? [];
				let matched = 0;
				for (let j = 0; j < value.length; j++) {
					const id = value[j];
					if (typeof id !== "string") continue;
					const card = getCard(cards, id);
					if (!card) continue;
					const nextContext: ConditionContext = {
						...context,
						referencedCard: snapshotFromDerived(deriveCard(context.config, card, cards), card),
					};
					if (!check.refListsMatch.match || evaluateConditions(check.refListsMatch.match, nextContext)) matched++;
				}
				const count = check.refListsMatch.count;
				const min = check.refListsMatch.min ?? 0;
				const max = check.refListsMatch.max ?? Number.POSITIVE_INFINITY;
				if (typeof count === "number" ? matched !== count : matched < min || matched > max) return false;
				continue;
			}
			if (typeof value !== "number" || !matchesAttribute(value, check)) return false;
		}
	}

	return true;
}

function evaluateTagChecks(condition: Condition, entity: EntitySnapshot): boolean {
	if (typeof condition.hasTag === "number" && !entity.tagIds.has(condition.hasTag)) return false;
	if (condition.hasTags) {
		for (let i = 0; i < condition.hasTags.length; i++) {
			if (!entity.tagIds.has(condition.hasTags[i])) return false;
		}
	}
	if (condition.hasAnyTag && condition.hasAnyTag.length > 0) {
		let any = false;
		for (let i = 0; i < condition.hasAnyTag.length; i++) {
			if (entity.tagIds.has(condition.hasAnyTag[i])) {
				any = true;
				break;
			}
		}
		if (!any) return false;
	}
	if (typeof condition.onlyHasTag === "number") {
		if (entity.tagIds.size !== 1 || !entity.tagIds.has(condition.onlyHasTag)) return false;
	}
	if (condition.onlyHasTags) {
		if (entity.tagIds.size !== condition.onlyHasTags.length) return false;
		for (let i = 0; i < condition.onlyHasTags.length; i++) {
			if (!entity.tagIds.has(condition.onlyHasTags[i])) return false;
		}
	}
	return true;
}

function evaluateDefinitionChecks(condition: Condition, entity: EntitySnapshot): boolean {
	if (condition.hasCardType && entity.cardType !== condition.hasCardType) return false;
	if (condition.hasAnyCardType && condition.hasAnyCardType.length > 0 && (!entity.cardType || !condition.hasAnyCardType.includes(entity.cardType))) return false;
	if (typeof condition.hasTemplate === "number" && entity.templateId !== condition.hasTemplate) return false;
	if (condition.hasAnyTemplate && condition.hasAnyTemplate.length > 0) {
		if (typeof entity.templateId !== "number" || !condition.hasAnyTemplate.includes(entity.templateId)) return false;
	}
	if (typeof condition.onlyHasTemplate === "number" && entity.templateId !== condition.onlyHasTemplate) return false;
	return true;
}

function evaluateCondition(condition: Condition, context: ConditionContext): boolean {
	const entity = resolveTargetEntity(condition.target, context);
	if (!entity) return false;
	return evaluateAttributeChecks(condition, entity, context)
		&& evaluateTagChecks(condition, entity)
		&& evaluateDefinitionChecks(condition, entity);
}

function evaluateConditions(conditions: Condition[] | undefined, context: ConditionContext): boolean {
	if (!conditions) return true;
	for (let i = 0; i < conditions.length; i++) {
		if (!evaluateCondition(conditions[i], context)) return false;
	}
	return true;
}

function getDerivedTags(
	config: FamineRefugeeConfig,
	values: Record<number, number>,
	stateTags: TagInstanceState[],
): Set<number> {
	const tags = new Set<number>();
	for (let i = 0; i < stateTags.length; i++) tags.add(stateTags[i].tagId);
	const host = { values, tagIds: tags };
	for (let i = 0; i < config.allTags.length; i++) {
		const tag = config.allTags[i];
		if (tag.kind !== "derived" || !tag.conditions) continue;
		if (evaluateConditions(tag.conditions, { host })) tags.add(tag.id);
	}
	return tags;
}

function createCardState(config: FamineRefugeeConfig, saveCard: SaveCard): CardState {
	const template = getTemplate(config, saveCard.templateId);
	const values: Record<number, AttributeValue> = {};
	for (let i = 0; i < (template.attributes ?? []).length; i++) {
		const binding = (template.attributes ?? [])[i];
		values[binding.id] = binding.value;
	}
	if (saveCard.values) {
		const keys = Object.keys(saveCard.values);
		for (let i = 0; i < keys.length; i++) values[Number(keys[i])] = saveCard.values[Number(keys[i])];
	}
	return {
		id: saveCard.id,
		templateId: saveCard.templateId,
		values,
		nextBehaviorTime: 0,
		tags: (template.tags ?? []).map((tagId) => createTagInstance(config, tagId)),
	};
}

export function createInitialState(config: FamineRefugeeConfig): FamineState {
	const cards: CardState[] = [];
	for (let i = 0; i < config.saveData.cards.length; i++) cards.push(createCardState(config, config.saveData.cards[i]));
	return {
		time: config.saveData.time,
		nextCardId: 100,
		cards,
		logs: [formatLogTime(config.saveData.time, config.initialLog)],
	};
}

export function deriveCard(
	config: FamineRefugeeConfig,
	card: CardState,
	cards: CardState[] = [card],
): CardDerived {
	const template = getTemplate(config, card.templateId);
	const values = { ...card.values };
	for (let i = 0; i < config.allAttributes.length; i++) {
		const definition = config.allAttributes[i];
		if (definition.kind === "derived" && definition.formula) {
			values[definition.id] = evaluateFormula(definition.formula, values, {
				resolveCard: (id) => getCard(cards, id),
			});
		}
	}
	const numericValues = getNumberValues(values);
	const tagIds = getDerivedTags(config, numericValues, card.tags);
	const derived = { template, values: numericValues, tagIds: Array.from(tagIds), gameOver: false };
	derived.gameOver = evaluateConditions(config.gameOver, { sourceCard: snapshotFromDerived(derived) });
	return derived;
}

export function getPlayerCard(config: FamineRefugeeConfig, state: FamineState): CardState | null {
	for (let i = 0; i < state.cards.length; i++) {
		if (state.cards[i].id === config.saveData.playerCardId) return state.cards[i];
	}
	return null;
}

function findAction(config: FamineRefugeeConfig, id: number): FamineAction | null {
	for (let i = 0; i < config.allActions.length; i++) {
		if (config.allActions[i].id === id) return config.allActions[i];
	}
	return null;
}

function getEffectDefinition(config: FamineRefugeeConfig, id: number): EffectDefinition | null {
	for (let i = 0; i < (config.allEffects ?? []).length; i++) {
		if ((config.allEffects ?? [])[i].id === id) return (config.allEffects ?? [])[i];
	}
	return null;
}

function resolveEffect(config: FamineRefugeeConfig, call: EffectCall): InlineEffect | null {
	if ("effectId" in call) return getEffectDefinition(config, call.effectId);
	return call;
}

export function getSlotRange(slot: ActionSlot): { min: number; max: number } {
	if (typeof slot.count === "number") return { min: slot.count, max: slot.count };
	const min = slot.min ?? 1;
	const max = slot.max ?? min;
	return { min, max };
}

function slotMatches(config: FamineRefugeeConfig, slot: ActionSlot, card: CardState, source: EntitySnapshot): boolean {
	const derived = deriveCard(config, card);
	return evaluateConditions(slot.conditions, {
		sourceCard: source,
		slot: snapshotFromDerived(derived),
	});
}

export function getAccessibleCards(config: FamineRefugeeConfig, cards: CardState[], actor: CardState): CardState[] {
	const locationId = getStringAttribute(actor.values, getAttributeId(config, "location"));
	const result: CardState[] = [];
	for (let i = 0; i < cards.length; i++) {
		const card = cards[i];
		if (card.id === actor.id) continue;
		const carrier = getStringAttribute(card.values, getAttributeId(config, "carrier"));
		if (carrier === actor.id) {
			result.push(card);
			continue;
		}
		if (carrier) continue;
		if (getStringAttribute(card.values, getAttributeId(config, "location")) === locationId) result.push(card);
	}
	return result;
}

export function getEligibleCards(
	config: FamineRefugeeConfig,
	state: FamineState,
	action: FamineAction,
	slotId: string,
	actor?: CardState,
): CardState[] {
	const player = actor ?? getPlayerCard(config, state);
	if (!player) return [];
	const slot = (action.slots ?? []).find((item) => item.id === slotId);
	if (!slot) return [];
	const source = snapshotFromDerived(deriveCard(config, player, state.cards));
	const cards: CardState[] = [];
	const accessible = getAccessibleCards(config, state.cards, player);
	for (let i = 0; i < accessible.length; i++) {
		if (slotMatches(config, slot, accessible[i], source)) cards.push(accessible[i]);
	}
	return cards;
}

function getVisibleActionsFromSource(config: FamineRefugeeConfig, source: CardState, cards: CardState[]): FamineAction[] {
	const derived = deriveCard(config, source, cards);
	const sourceSnapshot = snapshotFromDerived(derived, source);
	const actions: FamineAction[] = [];
	for (let i = 0; i < (derived.template.outgoing ?? []).length; i++) {
		const action = findAction(config, (derived.template.outgoing ?? [])[i]);
		if (!action) continue;
		if (evaluateConditions(action.conditions, { sourceCard: sourceSnapshot, cards, config })) actions.push(action);
	}
	return actions;
}

export function getVisibleActions(config: FamineRefugeeConfig, state: FamineState): FamineAction[] {
	const player = getPlayerCard(config, state);
	return player ? getVisibleActionsFromSource(config, player, state.cards) : [];
}

function getConditionSlotId(conditions: Condition[] | undefined): string | null {
	if (!conditions) return null;
	for (let i = 0; i < conditions.length; i++) {
		if (conditions[i].target.card === "slot" && conditions[i].target.slot) return conditions[i].target.slot ?? null;
	}
	return null;
}

function getSlotCard(
	slotId: string | null,
	assignments: Record<string, string[]>,
	cards: CardState[],
): CardState | null {
	if (!slotId) return null;
	const ids = assignments[slotId] ?? [];
	if (ids.length === 0) return null;
	return getCard(cards, ids[0]);
}

export function getActionTimeCost(
	config: FamineRefugeeConfig,
	action: FamineAction,
	player: CardState,
	assignments: Record<string, string[]> = {},
	cards: CardState[] = [player],
): number {
	const derived = deriveCard(config, player, cards);
	const sourceSnapshot = snapshotFromDerived(derived, player);
	const result = evaluateFormula(action.timeCost, derived.values, {
		evaluateConditions: (conditions) => {
			const slotId = getConditionSlotId(conditions);
			const slotCard = getSlotCard(slotId, assignments, cards);
			const slotSnapshot = slotCard ? snapshotFromDerived(deriveCard(config, slotCard)) : undefined;
			return evaluateConditions(conditions, { sourceCard: sourceSnapshot, slot: slotSnapshot });
		},
	});
	return Number.isFinite(result) ? Math.max(0, Math.ceil(result)) : 0;
}

function applyChangeAttributes(
	config: FamineRefugeeConfig,
	card: CardState,
	changes: Array<{ attributeId: number; delta?: number; set?: number; conditions?: Condition[] }>,
	evaluateChangeConditions?: (conditions: Condition[]) => boolean,
): CardState {
	const values = { ...card.values };
	for (let i = 0; i < changes.length; i++) {
		const change = changes[i];
		if (change.conditions && evaluateChangeConditions && !evaluateChangeConditions(change.conditions)) continue;
		const definition = config.allAttributes.find((attribute) => attribute.id === change.attributeId);
		if (!definition || definition.kind !== "base") continue;
		const current = getNumberAttribute(values, change.attributeId);
		let next = change.set ?? current + (change.delta ?? 0);
		if (typeof definition.typeParams?.min === "number") next = Math.max(definition.typeParams?.min, next);
		if (typeof definition.typeParams?.max === "number") next = Math.min(definition.typeParams?.max, next);
		values[change.attributeId] = next;
	}
	return { ...card, values };
}

function applyCardEffect(
	config: FamineRefugeeConfig,
	card: CardState,
	effect: InlineEffect,
	evaluateChangeConditions?: (conditions: Condition[]) => boolean,
): CardState {
	if (effect.kind === "changeAttributes") return applyChangeAttributes(config, card, effect.changes, evaluateChangeConditions);
	if (effect.kind === "addTag") {
		for (let i = 0; i < card.tags.length; i++) {
			if (card.tags[i].tagId === effect.tagId) return card;
		}
		return { ...card, tags: [...card.tags, createTagInstance(config, effect.tagId)] };
	}
	if (effect.kind === "removeTag") {
		const tags: TagInstanceState[] = [];
		for (let i = 0; i < card.tags.length; i++) {
			if (card.tags[i].tagId !== effect.tagId) tags.push(card.tags[i]);
		}
		return { ...card, tags };
	}
	if (effect.kind === "changeLocation") {
		const values = { ...card.values };
		values[getAttributeId(config, "location")] = effect.toLocation;
		return { ...card, values };
	}
	if (effect.kind === "changeTemplate") {
		const template = getTemplate(config, effect.templateId);
		const values = { ...card.values };
		for (let i = 0; i < (template.attributes ?? []).length; i++) {
			const binding = (template.attributes ?? [])[i];
			const definition = config.allAttributes.find((attribute) => attribute.id === binding.id);
			if (definition?.visible === false || typeof values[binding.id] !== "number") {
				values[binding.id] = binding.value;
			}
		}
		return { ...card, templateId: effect.templateId, values };
	}
	return card;
}

function replaceCard(cards: CardState[], card: CardState): CardState[] {
	const next: CardState[] = [];
	for (let i = 0; i < cards.length; i++) next.push(cards[i].id === card.id ? card : cards[i]);
	return next;
}

function getCard(cards: CardState[], id: string): CardState | null {
	for (let i = 0; i < cards.length; i++) if (cards[i].id === id) return cards[i];
	return null;
}

interface SlotAssignment {
	slot: ActionSlot;
	cards: CardState[];
}

function validateAssignments(
	config: FamineRefugeeConfig,
	action: FamineAction,
	source: CardState,
	assignments: Record<string, string[]>,
	cards: CardState[],
): SlotAssignment[] | null {
	const sourceSnapshot = snapshotFromDerived(deriveCard(config, source, cards));
	const used = new Set<string>();
	const result: SlotAssignment[] = [];
	for (let i = 0; i < (action.slots ?? []).length; i++) {
		const slot = (action.slots ?? [])[i];
		const ids = assignments[slot.id] ?? [];
		const range = getSlotRange(slot);
		if (ids.length < range.min || ids.length > range.max) return null;
		const assignedCards: CardState[] = [];
		for (let j = 0; j < ids.length; j++) {
			if (used.has(ids[j])) return null;
			used.add(ids[j]);
			const card = getCard(cards, ids[j]);
			if (!card || card.id === source.id) return null;
			if (!slotMatches(config, slot, card, sourceSnapshot)) return null;
			assignedCards.push(card);
		}
		result.push({ slot, cards: assignedCards });
	}
	const slotIds = new Set((action.slots ?? []).map((slot) => slot.id));
	const keys = Object.keys(assignments);
	for (let i = 0; i < keys.length; i++) {
		if (!slotIds.has(keys[i])) return null;
	}
	return result;
}

function getConditionContext(
	config: FamineRefugeeConfig,
	conditions: Condition[] | undefined,
	source: CardState,
	targetCard: CardState | null,
	fallbackSlot: CardState | null,
	slotMap: Record<string, string[]>,
	cards: CardState[],
): ConditionContext {
	const sourceSnapshot = snapshotFromDerived(deriveCard(config, source, cards));
	const slotId = getConditionSlotId(conditions);
	const slotCard = slotId ? getSlotCard(slotId, slotMap, cards) : fallbackSlot;
	return {
		sourceCard: sourceSnapshot,
		targetCard: targetCard ? snapshotFromDerived(deriveCard(config, targetCard), targetCard) : undefined,
		slot: slotCard ? snapshotFromDerived(deriveCard(config, slotCard), slotCard) : undefined,
		cards,
		config,
	};
}

interface EffectRuntime {
	config: FamineRefugeeConfig;
	sourceId: string;
	targetId?: string;
	slotMap: Record<string, string[]>;
	cards: CardState[];
	nextCardId: number;
	removeIds: Set<string>;
}

type EffectHandler = (runtime: EffectRuntime, effect: InlineEffect) => void;

function getEffectTargetIds(runtime: EffectRuntime, effect: InlineEffect): string[] {
	if (effect.target?.card === "slot" && effect.target.slot) return runtime.slotMap[effect.target.slot] ?? [];
	if (effect.target?.card === "targetCard" && runtime.targetId) return [runtime.targetId];
	if (effect.target?.card === "sourceCard" || !effect.target) return [runtime.sourceId];
	return [];
}

function applyTargetedEffect(runtime: EffectRuntime, effect: InlineEffect): void {
	const source = getCard(runtime.cards, runtime.sourceId);
	if (!source) return;
	const targetIds = getEffectTargetIds(runtime, effect);
	for (let i = 0; i < targetIds.length; i++) {
		const card = getCard(runtime.cards, targetIds[i]);
		if (!card) continue;
		const context = getConditionContext(runtime.config, effect.conditions, source, runtime.targetId ? getCard(runtime.cards, runtime.targetId) : null, card, runtime.slotMap, runtime.cards);
		if (!evaluateConditions(effect.conditions, context)) continue;
		const updated = applyCardEffect(runtime.config, card, effect, (conditions) => {
			const changeContext = getConditionContext(runtime.config, conditions, source, runtime.targetId ? getCard(runtime.cards, runtime.targetId) : null, card, runtime.slotMap, runtime.cards);
			return evaluateConditions(conditions, changeContext);
		});
		runtime.cards = replaceCard(runtime.cards, updated);
	}
}

function applyCreateCardEffect(runtime: EffectRuntime, effect: InlineEffect): void {
	if (effect.kind !== "addCard") return;
	const source = getCard(runtime.cards, runtime.sourceId);
	if (!source) return;
	const context = getConditionContext(runtime.config, effect.conditions, source, runtime.targetId ? getCard(runtime.cards, runtime.targetId) : null, null, runtime.slotMap, runtime.cards);
	if (!evaluateConditions(effect.conditions, context)) return;
	const id = `card_${runtime.nextCardId}`;
	runtime.nextCardId += 1;
	const sourceLocation = getStringAttribute(source.values, getAttributeId(runtime.config, "location")) ?? "";
	if (effect.to === "sourceLocation") {
		runtime.cards = [...runtime.cards, createCardState(runtime.config, { id, templateId: effect.templateId, values: { [getAttributeId(runtime.config, "location")]: sourceLocation } })];
		return;
	}
	const sourceBackpack = getStringListAttribute(source.values, getAttributeId(runtime.config, "backpack"));
	const created = createCardState(runtime.config, { id, templateId: effect.templateId, values: { [getAttributeId(runtime.config, "carrier")]: source.id, [getAttributeId(runtime.config, "location")]: "" } });
	const ownerValues = { ...source.values };
	ownerValues[getAttributeId(runtime.config, "backpack")] = [...sourceBackpack, id];
	runtime.cards = [...runtime.cards.map((card) => (card.id === source.id ? { ...card, values: ownerValues } : card)), created];
}

function applyMoveItemEffect(runtime: EffectRuntime, effect: InlineEffect): void {
	if (effect.kind !== "moveItemCard") return;
	const itemIds = effect.target?.card === "slot" && effect.target.slot ? runtime.slotMap[effect.target.slot] ?? [] : runtime.targetId ? [runtime.targetId] : [];
	const source = getCard(runtime.cards, runtime.sourceId);
	if (!source) return;
	const sourceLocation = getStringAttribute(source.values, getAttributeId(runtime.config, "location")) ?? "";
	const sourceBackpack = getStringListAttribute(source.values, getAttributeId(runtime.config, "backpack"));
	const capacity = getNumberAttribute(deriveCard(runtime.config, source, runtime.cards).values, getAttributeId(runtime.config, "carryCapacity"));
	const slots = getNumberAttribute(deriveCard(runtime.config, source, runtime.cards).values, getAttributeId(runtime.config, "carrySlots"));
	let carriedWeight = 0;
	for (let i = 0; i < sourceBackpack.length; i++) {
		const carried = getCard(runtime.cards, sourceBackpack[i]);
		if (carried) carriedWeight += getNumberAttribute(carried.values, getAttributeId(runtime.config, "weight"));
	}
	for (let i = 0; i < itemIds.length; i++) {
		const item = getCard(runtime.cards, itemIds[i]);
		if (!item) continue;
		let updatedCards = runtime.cards.map((card) => {
			const backpack = getStringListAttribute(card.values, getAttributeId(runtime.config, "backpack"));
			if (!backpack.includes(item.id)) return card;
			const values = { ...card.values };
			values[getAttributeId(runtime.config, "backpack")] = backpack.filter((id) => id !== item.id);
			return { ...card, values };
		});
		const values = { ...item.values };
		if (effect.to === "sourceBackpack" || effect.to === "targetBackpack") {
			const carrier = effect.to === "sourceBackpack" ? source : runtime.targetId ? getCard(updatedCards, runtime.targetId) : null;
			if (!carrier) continue;
			if (carrier.id === source.id) {
				if (sourceBackpack.length + 1 > slots) continue;
				if (carriedWeight + getNumberAttribute(item.values, getAttributeId(runtime.config, "weight")) > capacity) continue;
			}
			values[getAttributeId(runtime.config, "carrier")] = carrier.id;
			values[getAttributeId(runtime.config, "location")] = "";
			updatedCards = updatedCards.map((card) => {
				if (card.id !== carrier.id) return card;
				const own = { ...card.values };
				own[getAttributeId(runtime.config, "backpack")] = [...getStringListAttribute(card.values, getAttributeId(runtime.config, "backpack")), item.id];
				return { ...card, values: own };
			});
		} else {
			values[getAttributeId(runtime.config, "carrier")] = "";
			values[getAttributeId(runtime.config, "location")] = effect.to === "sourceLocation" ? sourceLocation : "";
		}
		updatedCards = updatedCards.map((card) => (card.id === item.id ? { ...card, values } : card));
		runtime.cards = updatedCards;
	}
}

function applyRemoveCardEffect(runtime: EffectRuntime, effect: InlineEffect): void {
	if (effect.kind !== "removeCard") return;
	const ids = getEffectTargetIds(runtime, effect);
	for (let i = 0; i < ids.length; i++) runtime.removeIds.add(ids[i]);
}

const effectHandlers: Record<InlineEffect["kind"], EffectHandler> = {
	changeAttributes: applyTargetedEffect,
	addTag: applyTargetedEffect,
	removeTag: applyTargetedEffect,
	changeTemplate: applyTargetedEffect,
	changeLocation: applyTargetedEffect,
	addCard: applyCreateCardEffect,
	removeCard: applyRemoveCardEffect,
	moveItemCard: applyMoveItemEffect,
};

function applyActionEffects(
	config: FamineRefugeeConfig,
	action: FamineAction,
	sourceId: string,
	assignments: SlotAssignment[],
	cards: CardState[],
	nextCardId: number,
	targetId?: string,
): { cards: CardState[]; nextCardId: number } {
	const slotMap: Record<string, string[]> = {};
	for (let i = 0; i < assignments.length; i++) slotMap[assignments[i].slot.id] = assignments[i].cards.map((card) => card.id);
	const runtime: EffectRuntime = { config, sourceId, targetId, slotMap, cards: cards.slice(), nextCardId, removeIds: new Set<string>() };
	for (let i = 0; i < (action.effects ?? []).length; i++) {
		const effect = resolveEffect(config, (action.effects ?? [])[i]);
		if (!effect) continue;
		effectHandlers[effect.kind](runtime, effect);
	}
	if (runtime.removeIds.size > 0) {
		runtime.cards = runtime.cards.filter((card) => !runtime.removeIds.has(card.id));
		for (let i = 0; i < runtime.cards.length; i++) {
			const backpack = getStringListAttribute(runtime.cards[i].values, getAttributeId(config, "backpack"));
			if (backpack.length === 0) continue;
			const filtered = backpack.filter((id) => !runtime.removeIds.has(id));
			if (filtered.length === backpack.length) continue;
			const values = { ...runtime.cards[i].values };
			values[getAttributeId(config, "backpack")] = filtered;
			runtime.cards[i] = { ...runtime.cards[i], values };
		}
	}
	return { cards: runtime.cards, nextCardId: runtime.nextCardId };
}

function applyTagAutoEffects(
	config: FamineRefugeeConfig,
	effects: EffectCall[],
	host: CardState,
	tag: TagInstanceState,
): { host: CardState; tag: TagInstanceState } {
	let currentHost = host;
	let currentTag = tag;
	for (let i = 0; i < effects.length; i++) {
		const effect = resolveEffect(config, effects[i]);
		if (!effect) continue;
		const hostSnapshot = snapshotFromDerived(deriveCard(config, currentHost));
		const tagSnapshot = snapshotFromTag(currentTag);
		if (!evaluateConditions(effect.conditions, { sourceTag: tagSnapshot, host: hostSnapshot })) continue;
		const tagCondition = (conditions: Condition[]): boolean => evaluateConditions(conditions, { sourceTag: tagSnapshot, host: snapshotFromDerived(deriveCard(config, currentHost)) });
		if (effect.kind === "changeAttributes" && effect.target?.card === "host") {
			currentHost = applyChangeAttributes(config, currentHost, effect.changes, tagCondition);
			continue;
		}
		if (effect.kind === "changeAttributes" && (effect.target?.card === "sourceTag" || !effect.target)) {
			const values = { ...currentTag.values };
			for (let j = 0; j < effect.changes.length; j++) {
				const change = effect.changes[j];
				if (change.conditions && !tagCondition(change.conditions)) continue;
				const definition = config.allAttributes.find((attribute) => attribute.id === change.attributeId);
				if (!definition) continue;
				const current = getNumberAttribute(values, change.attributeId);
				let next = change.set ?? current + (change.delta ?? 0);
				if (typeof definition.typeParams?.min === "number") next = Math.max(definition.typeParams?.min, next);
				if (typeof definition.typeParams?.max === "number") next = Math.min(definition.typeParams?.max, next);
				values[change.attributeId] = next;
			}
			currentTag = { ...currentTag, values };
		}
	}
	return { host: currentHost, tag: currentTag };
}

function runTagAutoActions(config: FamineRefugeeConfig, card: CardState): CardState {
	let current = card;
	for (let i = 0; i < current.tags.length; i++) {
		const tagDefinition = getTagDefinition(config, current.tags[i].tagId);
		if (!tagDefinition?.auto) continue;
		for (let j = 0; j < tagDefinition.auto.length; j++) {
			const auto = tagDefinition.auto[j];
			const hostSnapshot = snapshotFromDerived(deriveCard(config, current));
			const tagSnapshot = snapshotFromTag(current.tags[i]);
			if (!evaluateConditions(auto.conditions, { sourceTag: tagSnapshot, host: hostSnapshot })) continue;
			const result = applyTagAutoEffects(config, auto.effects, current, current.tags[i]);
			const tags = current.tags.slice();
			tags[i] = result.tag;
			current = { ...result.host, tags };
		}
	}
	return current;
}

function runAutoActions(config: FamineRefugeeConfig, card: CardState): CardState {
	let current = card;
	const template = getTemplate(config, current.templateId);
	for (let i = 0; i < (template.auto ?? []).length; i++) {
		const action = findAction(config, (template.auto ?? [])[i]);
		if (!action) continue;
		const derived = deriveCard(config, current);
		if (!evaluateConditions(action.conditions, { sourceCard: snapshotFromDerived(derived, current), cards: [current], config })) continue;
		const result = applyActionEffects(config, action, current.id, [], [current], 0);
		const updated = getCard(result.cards, current.id);
		if (updated) current = updated;
	}
	return runTagAutoActions(config, current);
}

function formatLogTime(time: number, message: string): string {
	const day = Math.floor(time / 1440) + 1;
	const minutesOfDay = time % 1440;
	const hour = Math.floor(minutesOfDay / 60);
	const minute = minutesOfDay % 60;
	return `第 ${day} 天 ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}：${message}`;
}

function appendLog(state: FamineState, message: string): FamineState {
	const logs = [...state.logs, formatLogTime(state.time, message)];
	return { ...state, logs: logs.slice(-MAX_LOGS) };
}

function runNpcBehaviors(config: FamineRefugeeConfig, state: FamineState): FamineState {
	const player = getPlayerCard(config, state);
	if (!player) return state;
	let current = state;
	const npcIds = current.cards.map((card) => card.id);
	for (let n = 0; n < npcIds.length; n++) {
		const npc = getCard(current.cards, npcIds[n]);
		if (!npc || npc.id === player.id) continue;
		const template = getTemplate(config, npc.templateId);
		const behavior = template.behavior;
		if (!behavior || (npc.nextBehaviorTime ?? 0) > current.time) continue;
		let acted = false;
		for (let i = 0; i < (template.outgoing ?? []).length && !acted; i++) {
			const action = findAction(config, (template.outgoing ?? [])[i]);
			if (!action) continue;
			const sourceSnapshot = snapshotFromDerived(deriveCard(config, npc, current.cards), npc);
			if (!evaluateConditions(action.conditions, { sourceCard: sourceSnapshot, cards: current.cards, config })) continue;
			const assignments: SlotAssignment[] = [];
			const used = new Set<string>();
			let valid = true;
			for (let j = 0; j < (action.slots ?? []).length; j++) {
				const slot = (action.slots ?? [])[j];
				const range = getSlotRange(slot);
				const eligible = getEligibleCards(config, current, action, slot.id, npc).filter((card) => !used.has(card.id));
				if (eligible.length < range.min) {
					valid = false;
					break;
				}
				const picked = eligible.slice(0, range.min);
				for (let k = 0; k < picked.length; k++) used.add(picked[k].id);
				assignments.push({ slot, cards: picked });
			}
			if (!valid) continue;
			const assignmentMap: Record<string, string[]> = {};
			for (let j = 0; j < assignments.length; j++) assignmentMap[assignments[j].slot.id] = assignments[j].cards.map((card) => card.id);
			const actionCost = getActionTimeCost(config, action, npc, assignmentMap, current.cards);
			const result = applyActionEffects(config, action, npc.id, assignments, current.cards, current.nextCardId);
			const nextCards = result.cards.map((card) => card.id === npc.id
				? { ...card, nextBehaviorTime: current.time + Math.max(behavior.decisionInterval, actionCost) }
				: card);
			current = appendLog({ ...current, cards: nextCards, nextCardId: result.nextCardId }, `${template.key}：${action.title}`);
			acted = true;
		}
		if (!acted) {
			current = { ...current, cards: current.cards.map((card) => card.id === npc.id ? { ...card, nextBehaviorTime: current.time + behavior.decisionInterval } : card) };
		}
	}
	return current;
}

function advanceMinutes(config: FamineRefugeeConfig, state: FamineState, minutes: number): FamineState {
	if (minutes <= 0) return state;
	let current = state;
	const endTime = current.time + minutes;
	const firstBoundary = (Math.floor(current.time / 60) + 1) * 60;
	for (let boundary = firstBoundary; boundary <= endTime; boundary += 60) {
		current = { ...current, time: boundary };
		const cards: CardState[] = [];
		for (let i = 0; i < current.cards.length; i++) cards.push(runAutoActions(config, current.cards[i]));
		current = { ...current, cards };
	}
	current = { ...current, time: endTime };
	const player = getPlayerCard(config, current);
	if (!player) return current;
	const derived = deriveCard(config, player);
	let message = config.tick.defaultLog;
	for (let i = 0; i < (config.tick.logRules ?? []).length; i++) {
		const rule = (config.tick.logRules ?? [])[i];
		if (!rule.when || evaluateConditions(rule.when, { sourceCard: snapshotFromDerived(derived) })) {
			message = rule.message;
			break;
		}
	}
	return runNpcBehaviors(config, appendLog(current, message));
}


export function getVisibleCards(config: FamineRefugeeConfig, state: FamineState): CardState[] {
	const player = getPlayerCard(config, state);
	if (!player) return [];
	const locationAttributeId = getAttributeId(config, "location");
	const locationId = getStringAttribute(player.values, locationAttributeId);
	const cards: CardState[] = [];
	for (let i = 0; i < state.cards.length; i++) {
		const card = state.cards[i];
		if (card.id === player.id) continue;
		if (getTemplate(config, card.templateId).cardType === "place") {
			if (card.id === locationId) cards.push(card);
			continue;
		}
		if (getStringAttribute(card.values, locationAttributeId) === locationId) cards.push(card);
	}
	return cards;
}

export function getIncomingActions(
	config: FamineRefugeeConfig,
	state: FamineState,
	targetId: string,
): FamineAction[] {
	const player = getPlayerCard(config, state);
	let target: CardState | null = null;
	for (let i = 0; i < state.cards.length; i++) {
		if (state.cards[i].id === targetId) {
			target = state.cards[i];
			break;
		}
	}
	if (!player || !target) return [];
	const sourceDerived = deriveCard(config, player, state.cards);
	const targetDerived = deriveCard(config, target, state.cards);
	const actions: FamineAction[] = [];
	for (let i = 0; i < (targetDerived.template.incoming ?? []).length; i++) {
		const action = findAction(config, (targetDerived.template.incoming ?? [])[i]);
		if (!action) continue;
		if (evaluateConditions(action.conditions, {
			sourceCard: snapshotFromDerived(sourceDerived, player),
			targetCard: snapshotFromDerived(targetDerived, target),
			cards: state.cards,
			config,
		})) actions.push(action);
	}
	return actions;
}

export function applyIncomingAction(
	config: FamineRefugeeConfig,
	state: FamineState,
	targetId: string,
	actionId: number,
): FamineState {
	const player = getPlayerCard(config, state);
	let target: CardState | null = null;
	for (let i = 0; i < state.cards.length; i++) {
		if (state.cards[i].id === targetId) {
			target = state.cards[i];
			break;
		}
	}
	if (!player || !target) return state;
	const action = findAction(config, actionId);
	if (!action) return state;
	const sourceDerived = deriveCard(config, player, state.cards);
	const targetDerived = deriveCard(config, target, state.cards);
	if (!evaluateConditions(action.conditions, {
		sourceCard: snapshotFromDerived(sourceDerived, player),
		targetCard: snapshotFromDerived(targetDerived, target),
		cards: state.cards,
		config,
	})) return state;
	const timeCost = getActionTimeCost(config, action, player, {}, state.cards);
	const result = applyActionEffects(config, action, player.id, [], state.cards, state.nextCardId, targetId);
	let next = appendLog({ ...state, cards: result.cards, nextCardId: result.nextCardId }, action.title);
	next = advanceMinutes(config, next, timeCost);
	return next;
}

export function applyAction(
	config: FamineRefugeeConfig,
	state: FamineState,
	actionId: number,
	assignments: Record<string, string[]> = {},
): FamineState {
	const player = getPlayerCard(config, state);
	if (!player) return state;
	const action = findAction(config, actionId);
	if (!action) return state;
	const sourceDerived = deriveCard(config, player, state.cards);
	if (!evaluateConditions(action.conditions, { sourceCard: snapshotFromDerived(sourceDerived, player), cards: state.cards, config })) return state;
	const resolved = validateAssignments(config, action, player, assignments, state.cards);
	if (!resolved) return state;

	const timeCost = getActionTimeCost(config, action, player, assignments, state.cards);
	const result = applyActionEffects(config, action, player.id, resolved, state.cards, state.nextCardId);
	let next = appendLog({ ...state, cards: result.cards, nextCardId: result.nextCardId }, action.title);
	next = advanceMinutes(config, next, timeCost);
	return next;
}
