import { evaluateFormula } from "../../formula/formula_eval.ts";
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
	values: Record<number, number>;
	tagIds: Set<number>;
	templateId?: number;
}

interface ConditionContext {
	source: EntitySnapshot;
	host?: EntitySnapshot;
	slot?: EntitySnapshot;
}

function snapshotFromDerived(derived: CardDerived): EntitySnapshot {
	return { values: derived.values, tagIds: new Set(derived.tagIds), templateId: derived.template.id };
}

function snapshotFromTag(tag: TagInstanceState): EntitySnapshot {
	return { values: tag.values, tagIds: new Set<number>() };
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
			values[binding.id] = binding.value;
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

function evaluateCondition(condition: Condition, context: ConditionContext): boolean {
	let entity: EntitySnapshot | undefined;
	if (condition.target === "source") entity = context.source;
	else if (condition.target === "host") entity = context.host;
	else entity = context.slot;
	if (!entity) return false;

	if (condition.attributes) {
		for (let i = 0; i < condition.attributes.length; i++) {
			const check = condition.attributes[i];
			const actual = entity.values[check.id];
			if (typeof actual !== "number" || !matchesAttribute(actual, check)) {
				return false;
			}
		}
	}

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
	if (typeof condition.hasTemplate === "number" && entity.templateId !== condition.hasTemplate) return false;
	if (condition.hasAnyTemplate && condition.hasAnyTemplate.length > 0) {
		if (typeof entity.templateId !== "number" || !condition.hasAnyTemplate.includes(entity.templateId)) return false;
	}
	if (typeof condition.onlyHasTemplate === "number" && entity.templateId !== condition.onlyHasTemplate) return false;
	return true;
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
		if (evaluateConditions(tag.conditions, { source: host, host })) tags.add(tag.id);
	}
	return tags;
}

function createCardState(config: FamineRefugeeConfig, saveCard: SaveCard): CardState {
	const template = getTemplate(config, saveCard.templateId);
	const values: Record<number, number> = {};
	for (let i = 0; i < template.attributes.length; i++) {
		const binding = template.attributes[i];
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
		tags: template.tags.map((tagId) => createTagInstance(config, tagId)),
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

export function deriveCard(config: FamineRefugeeConfig, card: CardState): CardDerived {
	const template = getTemplate(config, card.templateId);
	const values = { ...card.values };
	for (let i = 0; i < config.allAttributes.length; i++) {
		const definition = config.allAttributes[i];
		if (definition.kind === "derived" && definition.formula) {
			values[definition.id] = evaluateFormula(definition.formula, values);
		}
	}
	const tagIds = getDerivedTags(config, values, card.tags);
	const derived = { template, values, tagIds: Array.from(tagIds), gameOver: false };
	derived.gameOver = evaluateConditions(config.gameOver, { source: snapshotFromDerived(derived) });
	return derived;
}

export function getPlayerCard(config: FamineRefugeeConfig, state: FamineState): CardState | null {
	for (let i = 0; i < state.cards.length; i++) {
		if (state.cards[i].id === config.saveData.playerCardId) return state.cards[i];
	}
	return null;
}

function findAction(config: FamineRefugeeConfig, id: number): FamineAction | null {
	for (let i = 0; i < config.allRules.length; i++) {
		if (config.allRules[i].id === id) return config.allRules[i];
	}
	return null;
}

function getEffectDefinition(config: FamineRefugeeConfig, id: number): EffectDefinition | null {
	for (let i = 0; i < config.allEffects.length; i++) {
		if (config.allEffects[i].id === id) return config.allEffects[i];
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
		source,
		slot: snapshotFromDerived(derived),
	});
}

export function getEligibleCards(
	config: FamineRefugeeConfig,
	state: FamineState,
	action: FamineAction,
	slotId: string,
): CardState[] {
	const player = getPlayerCard(config, state);
	if (!player) return [];
	const slot = action.slots.find((item) => item.id === slotId);
	if (!slot) return [];
	const source = snapshotFromDerived(deriveCard(config, player));
	const cards: CardState[] = [];
	for (let i = 0; i < state.cards.length; i++) {
		const card = state.cards[i];
		if (card.id === player.id) continue;
		if (slotMatches(config, slot, card, source)) cards.push(card);
	}
	return cards;
}

function getVisibleActionsFromSource(config: FamineRefugeeConfig, source: CardState): FamineAction[] {
	const derived = deriveCard(config, source);
	const sourceSnapshot = snapshotFromDerived(derived);
	const actions: FamineAction[] = [];
	for (let i = 0; i < derived.template.outgoing.length; i++) {
		const action = findAction(config, derived.template.outgoing[i]);
		if (!action) continue;
		if (evaluateConditions(action.conditions, { source: sourceSnapshot })) actions.push(action);
	}
	return actions;
}

export function getVisibleActions(config: FamineRefugeeConfig, state: FamineState): FamineAction[] {
	const player = getPlayerCard(config, state);
	return player ? getVisibleActionsFromSource(config, player) : [];
}

function getConditionSlotId(conditions: Condition[] | undefined): string | null {
	if (!conditions) return null;
	for (let i = 0; i < conditions.length; i++) {
		if (conditions[i].target === "slot" && conditions[i].slot) return conditions[i].slot ?? null;
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
	const derived = deriveCard(config, player);
	const sourceSnapshot = snapshotFromDerived(derived);
	const result = evaluateFormula(action.timeCost, derived.values, {
		evaluateConditions: (conditions) => {
			const slotId = getConditionSlotId(conditions);
			const slotCard = getSlotCard(slotId, assignments, cards);
			const slotSnapshot = slotCard ? snapshotFromDerived(deriveCard(config, slotCard)) : undefined;
			return evaluateConditions(conditions, { source: sourceSnapshot, slot: slotSnapshot });
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
		const current = values[change.attributeId] ?? 0;
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
	if (effect.kind === "changeTemplate") {
		const template = getTemplate(config, effect.templateId);
		const values = { ...card.values };
		for (let i = 0; i < template.attributes.length; i++) {
			const binding = template.attributes[i];
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
	const sourceSnapshot = snapshotFromDerived(deriveCard(config, source));
	const used = new Set<string>();
	const result: SlotAssignment[] = [];
	for (let i = 0; i < action.slots.length; i++) {
		const slot = action.slots[i];
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
	const slotIds = new Set(action.slots.map((slot) => slot.id));
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
	fallbackSlot: CardState | null,
	slotMap: Record<string, string[]>,
	cards: CardState[],
): ConditionContext {
	const sourceSnapshot = snapshotFromDerived(deriveCard(config, source));
	const slotId = getConditionSlotId(conditions);
	const slotCard = slotId ? getSlotCard(slotId, slotMap, cards) : fallbackSlot;
	return {
		source: sourceSnapshot,
		slot: slotCard ? snapshotFromDerived(deriveCard(config, slotCard)) : undefined,
	};
}

function applyActionEffects(
	config: FamineRefugeeConfig,
	action: FamineAction,
	sourceId: string,
	assignments: SlotAssignment[],
	cards: CardState[],
	nextCardId: number,
): { cards: CardState[]; nextCardId: number } {
	let currentCards = cards.slice();
	let currentId = nextCardId;
	const slotMap: Record<string, string[]> = {};
	for (let i = 0; i < assignments.length; i++) {
		slotMap[assignments[i].slot.id] = assignments[i].cards.map((card) => card.id);
	}
	const removeIds = new Set<string>();

	for (let i = 0; i < action.effects.length; i++) {
		const effect = resolveEffect(config, action.effects[i]);
		if (!effect) continue;
		if (effect.kind === "addCard") {
			const source = getCard(currentCards, sourceId);
			if (!source) continue;
			const context = getConditionContext(config, effect.conditions, source, null, slotMap, currentCards);
			if (!evaluateConditions(effect.conditions, context)) continue;
			const id = `card_${currentId}`;
			currentId += 1;
			currentCards = [...currentCards, createCardState(config, { id, templateId: effect.templateId })];
			continue;
		}
		if (effect.kind === "removeCard") {
			let ids: string[];
			if (effect.target === "slot" && effect.slot) ids = slotMap[effect.slot] ?? [];
			else ids = [sourceId];
			for (let j = 0; j < ids.length; j++) removeIds.add(ids[j]);
			continue;
		}

		let targetIds: string[] = [];
		if (effect.target === "slot" && effect.slot) targetIds = slotMap[effect.slot] ?? [];
		else if (effect.target === "source" || !effect.target) targetIds = [sourceId];

		for (let j = 0; j < targetIds.length; j++) {
			const card = getCard(currentCards, targetIds[j]);
			if (!card) continue;
			const source = getCard(currentCards, sourceId);
			if (!source) continue;
			const context = getConditionContext(config, effect.conditions, source, card, slotMap, currentCards);
			if (!evaluateConditions(effect.conditions, context)) continue;
			const applyUpdated = applyCardEffect(config, card, effect, (conditions) => {
				const changeContext = getConditionContext(config, conditions, source, card, slotMap, currentCards);
				return evaluateConditions(conditions, changeContext);
			});
			currentCards = replaceCard(currentCards, applyUpdated);
		}
	}

	if (removeIds.size > 0) {
		const kept: CardState[] = [];
		for (let i = 0; i < currentCards.length; i++) {
			if (!removeIds.has(currentCards[i].id)) kept.push(currentCards[i]);
		}
		currentCards = kept;
	}
	return { cards: currentCards, nextCardId: currentId };
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
		if (!evaluateConditions(effect.conditions, { source: tagSnapshot, host: hostSnapshot })) continue;
		const tagCondition = (conditions: Condition[]): boolean => evaluateConditions(conditions, { source: tagSnapshot, host: snapshotFromDerived(deriveCard(config, currentHost)) });
		if (effect.kind === "changeAttributes" && effect.target === "host") {
			currentHost = applyChangeAttributes(config, currentHost, effect.changes, tagCondition);
			continue;
		}
		if (effect.kind === "changeAttributes" && (effect.target === "source" || !effect.target)) {
			const values = { ...currentTag.values };
			for (let j = 0; j < effect.changes.length; j++) {
				const change = effect.changes[j];
				if (change.conditions && !tagCondition(change.conditions)) continue;
				const definition = config.allAttributes.find((attribute) => attribute.id === change.attributeId);
				if (!definition) continue;
				const current = values[change.attributeId] ?? 0;
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
			if (!evaluateConditions(auto.conditions, { source: tagSnapshot, host: hostSnapshot })) continue;
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
	for (let i = 0; i < template.auto.length; i++) {
		const action = findAction(config, template.auto[i]);
		if (!action) continue;
		const derived = deriveCard(config, current);
		if (!evaluateConditions(action.conditions, { source: snapshotFromDerived(derived) })) continue;
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
	for (let i = 0; i < config.tick.logRules.length; i++) {
		const rule = config.tick.logRules[i];
		if (!rule.when || evaluateConditions(rule.when, { source: snapshotFromDerived(derived) })) {
			message = rule.message;
			break;
		}
	}
	return appendLog(current, message);
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
	const sourceDerived = deriveCard(config, player);
	if (!evaluateConditions(action.conditions, { source: snapshotFromDerived(sourceDerived) })) return state;
	const resolved = validateAssignments(config, action, player, assignments, state.cards);
	if (!resolved) return state;

	const timeCost = getActionTimeCost(config, action, player, assignments, state.cards);
	const result = applyActionEffects(config, action, player.id, resolved, state.cards, state.nextCardId);
	let next = appendLog({ ...state, cards: result.cards, nextCardId: result.nextCardId }, action.desc);
	next = advanceMinutes(config, next, timeCost);
	return next;
}
