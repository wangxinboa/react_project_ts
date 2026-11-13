import { evaluateFormula } from "../../formula/formula_eval.ts";
import type { FormulaContext } from "../../formula/formula_eval.ts";
import type { AttributeValue, BaseNumberCheck, NumberExpression, TargetRef } from "../../card_story_game_types/index.ts";
import { AddCardDestination, EffectType, FormulaOp, PromiseConfirmation, PromiseTimeRelation, AttributeKind, AttributeScope, CardType, ConditionGroupKind, ConditionNotKind, ConditionTarget, MoveItemDestination, TagKind } from "../../card_story_game_types/index.ts";
import { getNumberAttribute, getNumberValues, getStringAttribute, getStringListAttribute } from "./attribute_value.ts";
import type {
	ActionSlot,
	AgreementState,
	CardDerived,
	CardState,
	DialogueDefinition,
	DialogueHistoryEntry,
	DialogueNode,
	DialogueOption,
	DialogueState,
	Condition,
	ConditionExpression,
	ConditionGroup,
	ConditionNot,
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
	agreements?: Record<string, AgreementState>;
	dialogueHistory?: DialogueHistoryEntry[];
	time?: number;
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

function matchesAttribute(
	actual: number,
	check: BaseNumberCheck,
	values: Record<number, AttributeValue>,
	context: ConditionContext,
): boolean {
	const formulaContext: FormulaContext = {
		...(context.config ? createFormulaContext(context.config, context.cards ?? []) : {}),
		evaluateConditions: (conditions: ConditionExpression | ConditionExpression[]) => evaluateConditions(conditions, context),
	};
	if (check.gt !== undefined && !(actual > evaluateFormula(check.gt, values, formulaContext))) return false;
	if (check.gte !== undefined && !(actual >= evaluateFormula(check.gte, values, formulaContext))) return false;
	if (check.lt !== undefined && !(actual < evaluateFormula(check.lt, values, formulaContext))) return false;
	if (check.lte !== undefined && !(actual <= evaluateFormula(check.lte, values, formulaContext))) return false;
	if (check.eq !== undefined && actual !== evaluateFormula(check.eq, values, formulaContext)) return false;
	return true;
}

function resolveTargetEntity(target: TargetRef, context: ConditionContext): EntitySnapshot | undefined {
	if (target.card === ConditionTarget.SOURCE_CARD) return context.sourceCard;
	if (target.card === ConditionTarget.SOURCE_TAG) return context.sourceTag;
	if (target.card === ConditionTarget.TARGET_CARD) return context.targetCard;
	if (target.card === ConditionTarget.HOST) return context.host;
	if (target.card === ConditionTarget.REFERENCED_CARD) return context.referencedCard;
	return context.slot;
}

function evaluateAgreementCheck(condition: Condition, entity: EntitySnapshot, context: ConditionContext): boolean {
	const check = condition.agreement;
	if (!check) return true;
	if (!entity.cardId) return false;
	const cardId = entity.cardId;
	const card = getCard(context.cards ?? [], cardId);
	if (!card) return false;
	const owned = new Set(card.agreementIds ?? []);
	const now = context.time ?? 0;
	const includedTargetIds = (check.includesTargets ?? [])
		.map((target) => resolveTargetEntity(target, context)?.cardId)
		.filter((id): id is string => Boolean(id));
	if ((check.includesTargets ?? []).length !== includedTargetIds.length) return false;
	return Object.values(context.agreements ?? {}).some((agreement) => {
		if (agreement.definitionId !== check.definitionId || !owned.has(agreement.id)) return false;
		if (includedTargetIds.length > 0 && !includedTargetIds.every((id) => agreement.participants.includes(id))) return false;
		if (check.promiseConfirmation === PromiseConfirmation.CONFIRMED && agreement.promiseResolution === undefined) return false;
		if (check.promiseConfirmation === PromiseConfirmation.UNCONFIRMED && agreement.promiseResolution !== undefined) return false;
		if (check.promiseTime === PromiseTimeRelation.OVERDUE && !(agreement.promiseDeadline !== undefined && now >= agreement.promiseDeadline)) return false;
		if (check.promiseTime === PromiseTimeRelation.NOT_OVERDUE && !(agreement.promiseDeadline !== undefined && now < agreement.promiseDeadline)) return false;
		if (check.promiseResult !== undefined && agreement.promiseResolution?.promiseResult !== check.promiseResult) return false;
		if (check.hasPosition !== undefined && !(agreement.positions[check.hasPosition] ?? []).includes(cardId)) return false;
		if (check.hasPositions && !check.hasPositions.every((position) => (agreement.positions[position] ?? []).includes(cardId))) return false;
		return true;
	});
}

function evaluateDialogueCheck(condition: Condition, entity: EntitySnapshot, context: ConditionContext): boolean {
	const check = condition.dialogue;
	if (!check) return true;
	if (!entity.cardId) return false;
	const includedTargetIds = (check.includesTargets ?? [])
		.map((target) => resolveTargetEntity(target, context)?.cardId)
		.filter((id): id is string => Boolean(id));
	if ((check.includesTargets ?? []).length !== includedTargetIds.length) return false;
	let count = 0;
	const visitedNodeIds = new Set<string>();
	const chosenOptionIds = new Set<string>();
	const endedAtNodeIds = new Set<string>();
	const history = context.dialogueHistory ?? [];
	for (let i = 0; i < history.length; i++) {
		const entry = history[i];
		if (entry.dialogueId !== check.dialogueId) continue;
		if (!entry.participantIds.includes(entity.cardId)) continue;
		if (includedTargetIds.length > 0 && !includedTargetIds.every((id) => entry.participantIds.includes(id))) continue;
		count += entry.count;
		for (let j = 0; j < entry.visitedNodeIds.length; j++) visitedNodeIds.add(entry.visitedNodeIds[j]);
		for (let j = 0; j < entry.chosenOptionIds.length; j++) chosenOptionIds.add(entry.chosenOptionIds[j]);
		if (entry.endedAtNodeId) endedAtNodeIds.add(entry.endedAtNodeId);
	}
	if (check.triggered !== undefined && (count > 0) !== check.triggered) return false;
	if (check.count) {
		const formulaContext: FormulaContext = {
			...createFormulaContext(context.config!, context.cards ?? []),
			evaluateConditions: (conditions) => evaluateConditions(conditions, context),
		};
		const actual = count;
		if (check.count.gt !== undefined && !(actual > evaluateFormula(check.count.gt, entity.values, formulaContext))) return false;
		if (check.count.gte !== undefined && !(actual >= evaluateFormula(check.count.gte, entity.values, formulaContext))) return false;
		if (check.count.lt !== undefined && !(actual < evaluateFormula(check.count.lt, entity.values, formulaContext))) return false;
		if (check.count.lte !== undefined && !(actual <= evaluateFormula(check.count.lte, entity.values, formulaContext))) return false;
		if (check.count.eq !== undefined && actual !== evaluateFormula(check.count.eq, entity.values, formulaContext)) return false;
	}
	if (check.experiencedNodeId !== undefined && !visitedNodeIds.has(check.experiencedNodeId)) return false;
	if (check.experiencedNodeIds && !check.experiencedNodeIds.every((id) => visitedNodeIds.has(id))) return false;
	if (check.chosenOptionId !== undefined && !chosenOptionIds.has(check.chosenOptionId)) return false;
	if (check.chosenOptionIds && !check.chosenOptionIds.every((id) => chosenOptionIds.has(id))) return false;
	if (check.endedAtNodeId !== undefined && !endedAtNodeIds.has(check.endedAtNodeId)) return false;
	return true;
}

function evaluateAttributeChecks(condition: Condition, entity: EntitySnapshot, context: ConditionContext): boolean {
	if (condition.attributes) {
		for (let i = 0; i < condition.attributes.length; i++) {
			const check = condition.attributes[i];
			if (check.relationshipId !== undefined) {
				if (!check.relationship || check.id !== undefined || check.refId !== undefined || check.refListId !== undefined) return false;
				const sourceEntity = resolveTargetEntity(check.relationship.source, context);
				const targetEntity = resolveTargetEntity(check.relationship.target, context);
				if (!sourceEntity?.cardId || !targetEntity?.cardId) return false;
				const source = getCard(context.cards ?? [], sourceEntity.cardId);
				if (!source) return false;
				const relationship = source.relationships?.[targetEntity.cardId];
				const relationshipValues = relationship?.values ?? {};
				if (!matchesAttribute(relationshipValues[check.relationshipId] ?? 0, check, relationshipValues, context)) return false;
				continue;
			}
			if (check.relationship) return false;
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
					if (!check.refListsMatch.condition || evaluateConditions(check.refListsMatch.condition, nextContext)) matched++;
				}
				const formulaContext: FormulaContext = {
					...createFormulaContext(context.config, context.cards ?? []),
					evaluateConditions: (conditions: ConditionExpression | ConditionExpression[]) => evaluateConditions(conditions, context),
				};
				const evaluateQuantity = (expression: typeof check.refListsMatch.count): number | undefined => {
					if (expression === undefined) return undefined;
					return Math.max(0, Math.floor(evaluateFormula(expression, entity.values, formulaContext)));
				};
				const count = evaluateQuantity(check.refListsMatch.count);
				const min = evaluateQuantity(check.refListsMatch.min) ?? 0;
				const max = evaluateQuantity(check.refListsMatch.max) ?? Number.POSITIVE_INFINITY;
				if (max < min) return false;
				if (count !== undefined ? matched !== count : matched < min || matched > max) return false;
				continue;
			}
			if (typeof value !== "number" || !matchesAttribute(value, check, entity.values, context)) return false;
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
	if (condition.isCardType && entity.cardType !== condition.isCardType) return false;
	if (condition.isAnyCardType && condition.isAnyCardType.length > 0 && (!entity.cardType || !condition.isAnyCardType.includes(entity.cardType))) return false;
	if (typeof condition.isTemplate === "number" && entity.templateId !== condition.isTemplate) return false;
	if (condition.isAnyTemplate && condition.isAnyTemplate.length > 0) {
		if (typeof entity.templateId !== "number" || !condition.isAnyTemplate.includes(entity.templateId)) return false;
	}
	return true;
}

function hasCardCondition(condition: Condition): boolean {
	return condition.attributes !== undefined
		|| condition.hasTag !== undefined
		|| condition.hasTags !== undefined
		|| condition.hasAnyTag !== undefined
		|| condition.onlyHasTag !== undefined
		|| condition.onlyHasTags !== undefined
		|| condition.isTemplate !== undefined
		|| condition.isAnyTemplate !== undefined
		|| condition.isCardType !== undefined
		|| condition.isAnyCardType !== undefined
		|| condition.agreement !== undefined
		|| condition.dialogue !== undefined;
}

function evaluateCondition(condition: Condition, context: ConditionContext): boolean {
	if (!condition.target) {
		if (hasCardCondition(condition)) return false;
	} else {
		const entity = resolveTargetEntity(condition.target, context);
		if (!entity) return false;
		if (condition.worldTime !== undefined && !matchesAttribute(context.time ?? 0, condition.worldTime, {}, context)) return false;
		return evaluateAttributeChecks(condition, entity, context)
			&& evaluateTagChecks(condition, entity)
			&& evaluateDefinitionChecks(condition, entity)
			&& evaluateAgreementCheck(condition, entity, context)
			&& evaluateDialogueCheck(condition, entity, context);
	}
	if (condition.worldTime !== undefined && !matchesAttribute(context.time ?? 0, condition.worldTime, {}, context)) return false;
	return true;
}

function isConditionGroup(expression: ConditionExpression): expression is ConditionGroup {
	return "kind" in expression && (expression.kind === ConditionGroupKind.AND || expression.kind === ConditionGroupKind.OR);
}

function isConditionNot(expression: ConditionExpression): expression is ConditionNot {
	return "kind" in expression && expression.kind === ConditionNotKind.NOT;
}

function evaluateExpression(expression: ConditionExpression, context: ConditionContext): boolean {
	if (isConditionNot(expression)) return !evaluateExpression(expression.item, context);
	if (isConditionGroup(expression)) {
		if (expression.items.length === 0) return expression.kind === ConditionGroupKind.AND;
		if (expression.kind === ConditionGroupKind.AND) {
			for (let i = 0; i < expression.items.length; i++) {
				if (!evaluateExpression(expression.items[i], context)) return false;
			}
			return true;
		}
		for (let i = 0; i < expression.items.length; i++) {
			if (evaluateExpression(expression.items[i], context)) return true;
		}
		return false;
	}
	return evaluateCondition(expression, context);
}

function evaluateConditions(
	conditions: ConditionExpression | ConditionExpression[] | undefined,
	context: ConditionContext,
): boolean {
	if (!conditions) return true;
	const expressions = Array.isArray(conditions) ? conditions : [conditions];
	for (let i = 0; i < expressions.length; i++) {
		if (!evaluateExpression(expressions[i], context)) return false;
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
		if (tag.kind !== TagKind.DERIVED || !tag.condition) continue;
		if (evaluateConditions(tag.condition, { host })) tags.add(tag.id);
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
		nextAgreementId: 1,
		cards,
		agreements: {},
		dialogueHistory: [],
		logs: [formatLogTime(config.saveData.time, config.initialLog)],
	};
}

function collectFormulaAttributeIds(
	formula: NumberExpression | undefined,
	ids: Set<number>,
): void {
	if (formula === undefined || typeof formula === "number") return;
	switch (formula.op) {
		case FormulaOp.NUMBER_ATTRIBUTE_VALUE:
		case FormulaOp.NORMALIZE:
			if (typeof formula.attributeId === "number") ids.add(formula.attributeId);
			break;
		case FormulaOp.REF_LISTS_ATTRIBUTE_SUM:
			if (typeof formula.refAttributeId === "number") ids.add(formula.refAttributeId);
			break;
		case FormulaOp.REF_LISTS_ATTRIBUTE_COUNT:
			if (typeof formula.refAttributeId === "number") ids.add(formula.refAttributeId);
			break;
	}
	if ("args" in formula) {
		for (let i = 0; i < formula.args.length; i++) collectFormulaAttributeIds(formula.args[i], ids);
	}
	if ("value" in formula) collectFormulaAttributeIds(formula.value, ids);
	if ("min" in formula) collectFormulaAttributeIds(formula.min, ids);
	if ("max" in formula) collectFormulaAttributeIds(formula.max, ids);
	if (formula.op === FormulaOp.SELECT) {
		for (let i = 0; i < formula.branches.length; i++) {
			collectFormulaAttributeIds(formula.branches[i].value, ids);
		}
		collectFormulaAttributeIds(formula.else, ids);
	}
}

function getDerivedAttributeOrder(config: FamineRefugeeConfig): number[] {
	const definitions = new Map<number, (typeof config.allAttributes)[number]>();
	for (let i = 0; i < config.allAttributes.length; i++) definitions.set(config.allAttributes[i].id, config.allAttributes[i]);
	const order: number[] = [];
	const state = new Map<number, "visiting" | "done">();
	const visit = (id: number): void => {
		const definition = definitions.get(id);
		if (!definition || definition.kind !== AttributeKind.DERIVED) return;
		const current = state.get(id);
		if (current === "done") return;
		if (current === "visiting") return;
		state.set(id, "visiting");
		const dependencies = new Set<number>();
		collectFormulaAttributeIds(definition.formula, dependencies);
		for (const dependency of dependencies) {
			if (dependency !== id) visit(dependency);
		}
		state.set(id, "done");
		order.push(id);
	};
	for (let i = 0; i < config.allAttributes.length; i++) {
		const definition = config.allAttributes[i];
		if (definition.kind === AttributeKind.DERIVED) visit(definition.id);
	}
	return order;
}

export function deriveCard(
	config: FamineRefugeeConfig,
	card: CardState,
	cards: CardState[] = [card],
): CardDerived {
	const template = getTemplate(config, card.templateId);
	const values = { ...card.values };
	const derivedOrder = getDerivedAttributeOrder(config);
	for (let i = 0; i < derivedOrder.length; i++) {
		const definition = config.allAttributes.find((attribute) => attribute.id === derivedOrder[i]);
		if (definition?.kind === AttributeKind.DERIVED && definition.formula) {
			values[definition.id] = evaluateFormula(definition.formula, values, createFormulaContext(config, cards, card));
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

export function getSlotRange(
	config: FamineRefugeeConfig,
	slot: ActionSlot,
	source: CardState,
	cards: CardState[],
): { min: number; max: number; valid: boolean } {
	const derived = deriveCard(config, source, cards);
	const formulaContext: FormulaContext = {
		...createFormulaContext(config, cards),
		evaluateConditions: (conditions: ConditionExpression | ConditionExpression[]) => evaluateConditions(conditions, {
			sourceCard: snapshotFromDerived(derived, source),
			cards,
			config,
		}),
	};
	const evaluateQuantity = (expression: typeof slot.count): number | undefined => {
		if (expression === undefined) return undefined;
		return Math.max(0, Math.floor(evaluateFormula(expression, source.values, formulaContext)));
	};
	const count = evaluateQuantity(slot.count);
	if (count !== undefined) return { min: count, max: count, valid: true };
	const min = evaluateQuantity(slot.min) ?? 1;
	const max = evaluateQuantity(slot.max) ?? min;
	if (max < min) return { min, max, valid: false };
	return { min, max, valid: true };
}

function slotMatches(config: FamineRefugeeConfig, slot: ActionSlot, card: CardState, source: EntitySnapshot): boolean {
	const derived = deriveCard(config, card);
	return evaluateConditions(slot.condition, {
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

function getVisibleActionsFromSource(config: FamineRefugeeConfig, source: CardState, cards: CardState[], time = 0): FamineAction[] {
	const derived = deriveCard(config, source, cards);
	const sourceSnapshot = snapshotFromDerived(derived, source);
	const actions: FamineAction[] = [];
	for (let i = 0; i < (derived.template.outgoing ?? []).length; i++) {
		const action = findAction(config, (derived.template.outgoing ?? [])[i]);
		if (!action) continue;
		if (evaluateConditions(action.condition, { sourceCard: sourceSnapshot, cards, config, time })) actions.push(action);
	}
	return actions;
}

export function getVisibleActions(config: FamineRefugeeConfig, state: FamineState): FamineAction[] {
	const player = getPlayerCard(config, state);
	return player ? getVisibleActionsFromSource(config, player, state.cards, state.time) : [];
}

function getConditionSlotId(conditions: ConditionExpression | ConditionExpression[] | undefined): string | null {
	if (!conditions) return null;
	const expressions = Array.isArray(conditions) ? conditions : [conditions];
	for (let i = 0; i < expressions.length; i++) {
		const condition = expressions[i];
		if (isConditionNot(condition)) {
			const nested = getConditionSlotId([condition.item]);
			if (nested) return nested;
			continue;
		}
		if (isConditionGroup(condition)) {
			const nested = getConditionSlotId(condition.items);
			if (nested) return nested;
			continue;
		}
		if (condition.target && condition.target.card === ConditionTarget.SLOT && condition.target.slot) return condition.target.slot;
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

function evaluateChangeNumber(
	expression: NumberExpression | undefined,
	values: Record<number, AttributeValue>,
	context?: FormulaContext,
	fallback = 0,
): number {
	if (expression === undefined) return fallback;
	return evaluateFormula(expression, values, context);
}

function applyChangeAttributes(
	config: FamineRefugeeConfig,
	card: CardState,
	changes: Array<{ attributeId: number; delta?: NumberExpression; set?: NumberExpression; condition?: ConditionExpression }>,
	evaluateChangeConditions?: (conditions: ConditionExpression | ConditionExpression[]) => boolean,
	formulaContext?: FormulaContext,
): CardState {
	const values = { ...card.values };
	for (let i = 0; i < changes.length; i++) {
		const change = changes[i];
		if (change.condition && evaluateChangeConditions && !evaluateChangeConditions([change.condition])) continue;
		const definition = config.allAttributes.find((attribute) => attribute.id === change.attributeId);
		if (!definition || definition.kind !== AttributeKind.BASE) continue;
		const current = getNumberAttribute(values, change.attributeId);
		const set = change.set === undefined ? undefined : evaluateChangeNumber(change.set, values, formulaContext);
		const delta = evaluateChangeNumber(change.delta, values, formulaContext, 0);
		const next = set ?? current + delta;
		values[change.attributeId] = next;
	}
	return { ...card, values };
}

function applyCardEffect(
	config: FamineRefugeeConfig,
	card: CardState,
	effect: InlineEffect,
	evaluateChangeConditions?: (conditions: ConditionExpression | ConditionExpression[]) => boolean,
	formulaContext?: FormulaContext,
): CardState {
	if (effect.kind === EffectType.CHANGE_ATTRIBUTES) return applyChangeAttributes(config, card, effect.changes, evaluateChangeConditions, formulaContext);
	if (effect.kind === EffectType.ADD_TAG) {
		for (let i = 0; i < card.tags.length; i++) {
			if (card.tags[i].tagId === effect.tagId) return card;
		}
		return { ...card, tags: [...card.tags, createTagInstance(config, effect.tagId)] };
	}
	if (effect.kind === EffectType.REMOVE_TAG) {
		const tags: TagInstanceState[] = [];
		for (let i = 0; i < card.tags.length; i++) {
			if (card.tags[i].tagId !== effect.tagId) tags.push(card.tags[i]);
		}
		return { ...card, tags };
	}
	if (effect.kind === EffectType.CHANGE_LOCATION) {
		const values = { ...card.values };
		values[getAttributeId(config, "location")] = effect.toLocation;
		return { ...card, values };
	}
	if (effect.kind === EffectType.CHANGE_TEMPLATE) {
		const template = getTemplate(config, effect.templateId);
		const values = { ...card.values };
		for (let i = 0; i < (template.attributes ?? []).length; i++) {
			const binding = (template.attributes ?? [])[i];
			if (typeof values[binding.id] !== "number") {
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

function createFormulaContext(config: FamineRefugeeConfig | undefined, cards: CardState[], host?: CardState): FormulaContext {
	const context: FormulaContext = {
		resolveCard: (id) => getCard(cards, id),
	};
	if (host) {
		const template = getTemplate(config as FamineRefugeeConfig, host.templateId);
		const hostSnapshot = {
			values: getNumberValues(host.values),
			tagIds: new Set(host.tags.map((tag) => tag.tagId)),
			templateId: host.templateId,
			cardType: template.cardType,
			cardId: host.id,
		};
		context.evaluateConditions = (conditions) => evaluateConditions(conditions, {
			host: hostSnapshot,
			cards,
			config,
		});
	}
	return context;
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
		const range = getSlotRange(config, slot, source, cards);
		if (!range.valid || ids.length < range.min || ids.length > range.max) return null;
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
	conditions: ConditionExpression | ConditionExpression[] | undefined,
	source: CardState,
	targetCard: CardState | null,
	fallbackSlot: CardState | null,
	slotMap: Record<string, string[]>,
	cards: CardState[],
	agreements: Record<string, AgreementState> = {},
	dialogueHistory: DialogueHistoryEntry[] = [],
	time = 0,
): ConditionContext {
	const sourceSnapshot = snapshotFromDerived(deriveCard(config, source, cards), source);
	const slotId = getConditionSlotId(conditions);
	const slotCard = slotId ? getSlotCard(slotId, slotMap, cards) : fallbackSlot;
	return {
		sourceCard: sourceSnapshot,
		targetCard: targetCard ? snapshotFromDerived(deriveCard(config, targetCard), targetCard) : undefined,
		slot: slotCard ? snapshotFromDerived(deriveCard(config, slotCard), slotCard) : undefined,
		cards,
		config,
		agreements,
		dialogueHistory,
		time,
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
	dialogue?: DialogueState;
	agreements: Record<string, AgreementState>;
	dialogueHistory: DialogueHistoryEntry[];
	nextAgreementId: number;
	time: number;
}

type EffectHandler = (runtime: EffectRuntime, effect: InlineEffect) => void;

function getEffectTargetIds(runtime: EffectRuntime, effect: InlineEffect): string[] {
	if (effect.target?.card === ConditionTarget.SLOT && effect.target.slot) return runtime.slotMap[effect.target.slot] ?? [];
	if (effect.target?.card === ConditionTarget.TARGET_CARD && runtime.targetId) return [runtime.targetId];
	if (effect.target?.card === ConditionTarget.SOURCE_CARD || !effect.target) return [runtime.sourceId];
	return [];
}

function applyTargetedEffect(runtime: EffectRuntime, effect: InlineEffect): void {
	const source = getCard(runtime.cards, runtime.sourceId);
	if (!source) return;
	const targetIds = getEffectTargetIds(runtime, effect);
	for (let i = 0; i < targetIds.length; i++) {
		const card = getCard(runtime.cards, targetIds[i]);
		if (!card) continue;
		const context = getConditionContext(runtime.config, effect.condition, source, runtime.targetId ? getCard(runtime.cards, runtime.targetId) : null, card, runtime.slotMap, runtime.cards, {}, [], runtime.time);
		if (!evaluateConditions(effect.condition, context)) continue;
		const updated = applyCardEffect(runtime.config, card, effect, (conditions) => {
			const changeContext = getConditionContext(runtime.config, conditions, source, runtime.targetId ? getCard(runtime.cards, runtime.targetId) : null, card, runtime.slotMap, runtime.cards, {}, [], runtime.time);
			return evaluateConditions(conditions, changeContext);
		}, {
			...createFormulaContext(runtime.config, runtime.cards),
			evaluateConditions: (conditions) => {
				const changeContext = getConditionContext(runtime.config, conditions, source, runtime.targetId ? getCard(runtime.cards, runtime.targetId) : null, card, runtime.slotMap, runtime.cards, {}, [], runtime.time);
				return evaluateConditions(conditions, changeContext);
			},
		});
		runtime.cards = replaceCard(runtime.cards, updated);
	}
}

function applyCreateCardEffect(runtime: EffectRuntime, effect: InlineEffect): void {
	if (effect.kind !== EffectType.ADD_CARD) return;
	const source = getCard(runtime.cards, runtime.sourceId);
	if (!source) return;
	const context = getConditionContext(runtime.config, effect.condition, source, runtime.targetId ? getCard(runtime.cards, runtime.targetId) : null, null, runtime.slotMap, runtime.cards, {}, [], runtime.time);
	if (!evaluateConditions(effect.condition, context)) return;
	const id = `card_${runtime.nextCardId}`;
	runtime.nextCardId += 1;
	const sourceLocation = getStringAttribute(source.values, getAttributeId(runtime.config, "location")) ?? "";
	if (effect.to === AddCardDestination.SOURCE_LOCATION) {
		runtime.cards = [...runtime.cards, createCardState(runtime.config, { id, templateId: effect.templateId, values: { [getAttributeId(runtime.config, "location")]: sourceLocation } })];
		return;
	}
	const sourceBackpack = getStringListAttribute(source.values, getAttributeId(runtime.config, "backpack"));
	const created = createCardState(runtime.config, { id, templateId: effect.templateId, values: { [getAttributeId(runtime.config, "carrier")]: source.id, [getAttributeId(runtime.config, "location")]: "" } });
	const ownerValues = { ...source.values };
	ownerValues[getAttributeId(runtime.config, "backpack")] = [...sourceBackpack, id];
	runtime.cards = [...runtime.cards.map((card) => (card.id === source.id ? { ...card, values: ownerValues } : card)), created];
}

function simulateMoveItemCard(
	config: FamineRefugeeConfig,
	cards: CardState[],
	itemId: string,
	to: MoveItemDestination,
	source: CardState,
	target: CardState | null,
): CardState[] | null {
	const item = getCard(cards, itemId);
	if (!item) return null;
	const backpackId = getAttributeId(config, "backpack");
	const carrierId = getAttributeId(config, "carrier");
	const locationId = getAttributeId(config, "location");
	const weightId = getAttributeId(config, "weight");
	const capacityId = getAttributeId(config, "carryCapacity");
	const slotsId = getAttributeId(config, "carrySlots");

	let updated = cards.map((card) => {
		const backpack = getStringListAttribute(card.values, backpackId);
		if (!backpack.includes(itemId)) return card;
		const values = { ...card.values };
		values[backpackId] = backpack.filter((id) => id !== itemId);
		return { ...card, values };
	});
	const values = { ...item.values };
	if (to === MoveItemDestination.SOURCE_BACKPACK || to === MoveItemDestination.TARGET_BACKPACK) {
		const carrier = to === MoveItemDestination.SOURCE_BACKPACK ? source : target;
		if (!carrier) return null;
		const current = getCard(updated, carrier.id);
		if (!current) return null;
		const backpack = getStringListAttribute(current.values, backpackId);
		const derived = deriveCard(config, current, updated);
		const slots = getNumberAttribute(derived.values, slotsId);
		let weight = getNumberAttribute(item.values, weightId);
		for (let i = 0; i < backpack.length; i++) {
			const carried = getCard(updated, backpack[i]);
			if (carried) weight += getNumberAttribute(carried.values, weightId);
		}
		if (backpack.length + 1 > slots) return null;
		if (weight > getNumberAttribute(derived.values, capacityId)) return null;
		values[carrierId] = carrier.id;
		values[locationId] = "";
		updated = updated.map((card) => {
			if (card.id !== carrier.id) return card;
			const own = { ...card.values };
			own[backpackId] = [...getStringListAttribute(card.values, backpackId), itemId];
			return { ...card, values: own };
		});
	} else {
		const place = to === MoveItemDestination.SOURCE_LOCATION ? source : target;
		values[carrierId] = "";
		values[locationId] = place ? (getStringAttribute(place.values, locationId) ?? "") : "";
	}
	return updated.map((card) => (card.id === itemId ? { ...card, values } : card));
}

function getMoveItemIds(effect: InlineEffect, slotMap: Record<string, string[]>, targetId?: string): string[] {
	if (effect.kind !== EffectType.MOVE_ITEM_CARD) return [];
	return effect.target?.card === ConditionTarget.SLOT && effect.target.slot
		? slotMap[effect.target.slot] ?? []
		: targetId ? [targetId] : [];
}

function validateMoveItemEffects(
	config: FamineRefugeeConfig,
	effects: InlineEffect[],
	slotMap: Record<string, string[]>,
	sourceId: string,
	targetId: string | undefined,
	cards: CardState[],
): boolean {
	const source = getCard(cards, sourceId);
	if (!source) return false;
	const target = targetId ? getCard(cards, targetId) : null;
	let simulated = cards;
	for (let i = 0; i < effects.length; i++) {
		const effect = effects[i];
		if (effect.kind !== EffectType.MOVE_ITEM_CARD) continue;
		const itemIds = getMoveItemIds(effect, slotMap, targetId);
		for (let j = 0; j < itemIds.length; j++) {
			const next = simulateMoveItemCard(config, simulated, itemIds[j], effect.to, source, target);
			if (!next) return false;
			simulated = next;
		}
	}
	return true;
}

function applyMoveItemEffect(runtime: EffectRuntime, effect: InlineEffect): void {
	if (effect.kind !== EffectType.MOVE_ITEM_CARD) return;
	const source = getCard(runtime.cards, runtime.sourceId);
	if (!source) return;
	const target = runtime.targetId ? getCard(runtime.cards, runtime.targetId) : null;
	const itemIds = getMoveItemIds(effect, runtime.slotMap, runtime.targetId);
	for (let i = 0; i < itemIds.length; i++) {
		const next = simulateMoveItemCard(runtime.config, runtime.cards, itemIds[i], effect.to, source, target);
		if (!next) return;
		runtime.cards = next;
	}
}

function applyRemoveCardEffect(runtime: EffectRuntime, effect: InlineEffect): void {
	if (effect.kind !== EffectType.REMOVE_CARD) return;
	const ids = getEffectTargetIds(runtime, effect);
	for (let i = 0; i < ids.length; i++) runtime.removeIds.add(ids[i]);
}

function applyStartDialogueEffect(runtime: EffectRuntime, effect: InlineEffect): void {
	if (effect.kind !== EffectType.START_DIALOGUE) return;
	const dialogue = runtime.config.allDialogues.find((item) => item.id === effect.dialogueId);
	if (!dialogue || dialogue.nodes.length === 0) return;
	const targetIds = effect.target?.card === ConditionTarget.SLOT && effect.target.slot
		? runtime.slotMap[effect.target.slot] ?? []
		: runtime.targetId ? [runtime.targetId] : [];
	const source = getCard(runtime.cards, runtime.sourceId);
	const target = targetIds[0] ? getCard(runtime.cards, targetIds[0]) : null;
	let nodeId = dialogue.nodes[0]?.id;
	for (let i = 0; i < (dialogue.entries ?? []).length; i++) {
		const entry = dialogue.entries?.[i];
		if (!entry || !source || !target) continue;
		const context = getConditionContext(runtime.config, entry.condition, source, target, null, runtime.slotMap, runtime.cards, runtime.agreements, runtime.dialogueHistory, runtime.time);
		if (evaluateConditions(entry.condition, context)) {
			nodeId = entry.nodeId;
			break;
		}
	}
	if (!nodeId) return;
	if (targetIds[0]) {
		const participantIds = [runtime.sourceId, targetIds[0]];
		const existing = runtime.dialogueHistory.find((entry) =>
			entry.dialogueId === dialogue.id &&
			entry.initiatorId === runtime.sourceId &&
			entry.participantIds.length === participantIds.length &&
			entry.participantIds.every((id) => participantIds.includes(id)),
		);
		if (existing) {
			existing.count += 1;
			if (!existing.visitedNodeIds.includes(nodeId)) existing.visitedNodeIds.push(nodeId);
		} else {
			runtime.dialogueHistory.push({
				dialogueId: dialogue.id,
				initiatorId: runtime.sourceId,
				participantIds,
				count: 1,
				visitedNodeIds: [nodeId],
				chosenOptionIds: [],
			});
		}
	}
	runtime.dialogue = {
		dialogueId: dialogue.id,
		nodeId,
		sourceCardId: runtime.sourceId,
		targetCardId: targetIds[0],
		slotMap: runtime.slotMap,
	};
}

function resolveRuntimeCardId(runtime: EffectRuntime, target: TargetRef): string | undefined {
	if (target.card === ConditionTarget.SOURCE_CARD) return runtime.sourceId;
	if (target.card === ConditionTarget.TARGET_CARD) return runtime.targetId;
	if (target.card === ConditionTarget.SLOT && target.slot) return runtime.slotMap[target.slot]?.[0];
	return undefined;
}

function applyChangeRelationshipEffect(runtime: EffectRuntime, effect: InlineEffect): void {
	if (effect.kind !== EffectType.CHANGE_RELATIONSHIP_ATTRIBUTES) return;
	const sourceId = resolveRuntimeCardId(runtime, effect.relationship.source);
	const targetId = resolveRuntimeCardId(runtime, effect.relationship.target);
	if (!sourceId || !targetId) return;
	const source = getCard(runtime.cards, sourceId);
	if (!source) return;
	const current = source.relationships?.[targetId] ?? { values: {} };
	const values = { ...current.values };
	const formulaContext: FormulaContext = {
		...createFormulaContext(runtime.config, runtime.cards),
		evaluateConditions: (conditions) => evaluateConditions(conditions, {
			sourceCard: snapshotFromDerived(deriveCard(runtime.config, source, runtime.cards), source),
			targetCard: runtime.targetId ? snapshotFromDerived(deriveCard(runtime.config, getCard(runtime.cards, runtime.targetId) ?? source, runtime.cards)) : undefined,
			slot: undefined,
			cards: runtime.cards,
			config: runtime.config,
		}),
	};
	for (let i = 0; i < effect.changes.length; i++) {
		const change = effect.changes[i];
		if (change.condition) {
			const context = getConditionContext(runtime.config, change.condition, source, runtime.targetId ? getCard(runtime.cards, runtime.targetId) : null, source, runtime.slotMap, runtime.cards, {}, [], runtime.time);
			if (!evaluateConditions(change.condition, context)) continue;
		}
		const definition = runtime.config.allAttributes.find((attribute) => attribute.id === change.attributeId);
		if (!definition || definition.scope !== AttributeScope.RELATIONSHIP) continue;
		const currentValue = getNumberAttribute(values, change.attributeId);
		const set = change.set === undefined ? undefined : evaluateFormula(change.set, values, formulaContext);
		const delta = change.delta === undefined ? 0 : evaluateFormula(change.delta, values, formulaContext);
		const next = set ?? currentValue + delta;
		values[change.attributeId] = next;
	}
	const relationships = { ...(source.relationships ?? {}) };
	relationships[targetId] = { ...current, values };
	runtime.cards = replaceCard(runtime.cards, { ...source, relationships });
}

function applyCreateAgreementEffect(runtime: EffectRuntime, effect: InlineEffect): void {
	if (effect.kind !== EffectType.CREATE_AGREEMENT || !runtime.targetId) return;
	const definition = runtime.config.allAgreements.find((agreement) => agreement.id === effect.definitionId);
	if (!definition) return;
	const participants = [runtime.sourceId, runtime.targetId];
	const existing = Object.values(runtime.agreements).find((agreement) =>
		agreement.definitionId === definition.id &&
		agreement.participants.length === participants.length &&
		agreement.participants.every((id) => participants.includes(id)),
	);
	if (existing) return;
	const positions: Record<string, string[]> = {};
	if (effect.positions) {
		const keys = Object.keys(effect.positions);
		for (let i = 0; i < keys.length; i++) {
			positions[keys[i]] = effect.positions[keys[i]]
				.map((target) => resolveRuntimeCardId(runtime, target))
				.filter((id): id is string => id !== undefined && participants.includes(id));
		}
	}
	const id = `agreement_${runtime.nextAgreementId}`;
	runtime.nextAgreementId += 1;
	const source = getCard(runtime.cards, runtime.sourceId);
	const duration = definition.promiseWaitTime !== undefined && source
		? evaluateFormula(definition.promiseWaitTime, source.values, createFormulaContext(runtime.config, runtime.cards))
		: undefined;
	runtime.agreements[id] = {
		id,
		definitionId: definition.id,
		participants,
		positions: positions,
		proposerId: runtime.sourceId,
		knownBy: [runtime.sourceId, runtime.targetId],
		acceptedBy: [runtime.sourceId, runtime.targetId],
		promiseCreatedAt: runtime.time,
		promiseDeadline: duration === undefined ? undefined : runtime.time + Math.max(0, duration),
	};
	runtime.cards = runtime.cards.map((card) => {
		if (card.id !== runtime.sourceId && card.id !== runtime.targetId) return card;
		return { ...card, agreementIds: [...(card.agreementIds ?? []), id] };
	});
}

function applyConfirmPromiseEffect(runtime: EffectRuntime, effect: InlineEffect): void {
	if (effect.kind !== EffectType.CONFIRM_PROMISE || !runtime.targetId) return;
	const agreement = Object.values(runtime.agreements).find((item) =>
		item.definitionId === effect.definitionId &&
		item.participants.includes(runtime.sourceId) &&
		item.participants.includes(runtime.targetId ?? "") &&
		item.promiseResolution === undefined,
	);
	if (!agreement) return;
	agreement.promiseResolution = {
		promiseResult: effect.promiseResult,
		promiseAt: runtime.time,
		promiseConfirmedBy: [runtime.sourceId, runtime.targetId].filter((id): id is string => Boolean(id)),
	};
}

const effectHandlers: Record<InlineEffect["kind"], EffectHandler> = {
	[EffectType.CHANGE_ATTRIBUTES]: applyTargetedEffect,
	[EffectType.ADD_TAG]: applyTargetedEffect,
	[EffectType.REMOVE_TAG]: applyTargetedEffect,
	[EffectType.CHANGE_TEMPLATE]: applyTargetedEffect,
	[EffectType.CHANGE_LOCATION]: applyTargetedEffect,
	[EffectType.ADD_CARD]: applyCreateCardEffect,
	[EffectType.REMOVE_CARD]: applyRemoveCardEffect,
	[EffectType.MOVE_ITEM_CARD]: applyMoveItemEffect,
	[EffectType.START_DIALOGUE]: applyStartDialogueEffect,
	[EffectType.CHANGE_RELATIONSHIP_ATTRIBUTES]: applyChangeRelationshipEffect,
	[EffectType.CREATE_AGREEMENT]: applyCreateAgreementEffect,
	[EffectType.CONFIRM_PROMISE]: applyConfirmPromiseEffect,
};

function planActionEffects(
	config: FamineRefugeeConfig,
	action: FamineAction,
	sourceId: string,
	assignments: SlotAssignment[],
	cards: CardState[],
	targetId?: string,
): { effects: InlineEffect[]; slotMap: Record<string, string[]> } {
	const slotMap: Record<string, string[]> = {};
	for (let i = 0; i < assignments.length; i++) slotMap[assignments[i].slot.id] = assignments[i].cards.map((card) => card.id);
	const source = getCard(cards, sourceId);
	const target = targetId ? getCard(cards, targetId) : null;
	if (!source) return { effects: [], slotMap };
	const effects: InlineEffect[] = [];
	for (let i = 0; i < (action.effects ?? []).length; i++) {
		const effect = resolveEffect(config, (action.effects ?? [])[i]);
		if (!effect) continue;
		const context = getConditionContext(config, effect.condition, source, target, null, slotMap, cards);
		if (!evaluateConditions(effect.condition, context)) continue;
		let planned: InlineEffect = { ...effect, condition: undefined };
		if (effect.kind === EffectType.CHANGE_ATTRIBUTES) {
			const changes = effect.changes.filter((change) => {
				if (!change.condition) return true;
				const changeContext = getConditionContext(config, change.condition, source, target, source, slotMap, cards);
				return evaluateConditions(change.condition, changeContext);
			});
			if (changes.length === 0) continue;
			planned = { ...effect, changes: changes.map((change) => ({ ...change, condition: undefined })), condition: undefined };
		}
		effects.push(planned);
	}
	return { effects, slotMap };
}

function applyCardAttributeReactions(config: FamineRefugeeConfig, card: CardState, time: number): CardState {
	const runtime: EffectRuntime = {
		config,
		sourceId: card.id,
		slotMap: {},
		cards: [card],
		nextCardId: 0,
		removeIds: new Set<string>(),
		agreements: {},
		dialogueHistory: [],
		nextAgreementId: 1,
		time,
	};
	applyAttributeReactions(runtime);
	return getCard(runtime.cards, card.id) ?? card;
}

function applyAttributeReactions(runtime: EffectRuntime): void {
	const source = getCard(runtime.cards, runtime.sourceId);
	if (!source) return;
	const target = runtime.targetId ? getCard(runtime.cards, runtime.targetId) : null;
	for (let i = 0; i < runtime.config.allAttributes.length; i++) {
		const definition = runtime.config.allAttributes[i];
		if (!definition.reactions) continue;
		for (let j = 0; j < definition.reactions.length; j++) {
			const reaction = definition.reactions[j];
			const context = getConditionContext(
				runtime.config,
				reaction.condition,
				source,
				target,
				null,
				runtime.slotMap,
				runtime.cards,
				runtime.agreements,
				runtime.dialogueHistory,
				runtime.time,
			);
			if (!evaluateConditions(reaction.condition, context)) continue;
			for (let k = 0; k < reaction.effects.length; k++) {
				const effect = resolveEffect(runtime.config, reaction.effects[k]);
				if (!effect) continue;
				const effectContext = getConditionContext(
					runtime.config,
					effect.condition,
					source,
					target,
					null,
					runtime.slotMap,
					runtime.cards,
					runtime.agreements,
					runtime.dialogueHistory,
					runtime.time,
				);
				if (!evaluateConditions(effect.condition, effectContext)) continue;
				effectHandlers[effect.kind](runtime, effect);
			}
		}
	}
}

function applyActionEffects(
	config: FamineRefugeeConfig,
	action: FamineAction,
	sourceId: string,
	assignments: SlotAssignment[],
	cards: CardState[],
	nextCardId: number,
	targetId?: string,
	agreements: Record<string, AgreementState> = {},
	dialogueHistory: DialogueHistoryEntry[] = [],
	nextAgreementId = 1,
	time = 0,
): { cards: CardState[]; nextCardId: number; dialogue?: DialogueState; agreements?: Record<string, AgreementState>; dialogueHistory?: DialogueHistoryEntry[]; nextAgreementId?: number } {
	const plan = planActionEffects(config, action, sourceId, assignments, cards, targetId);
	if (!validateMoveItemEffects(config, plan.effects, plan.slotMap, sourceId, targetId, cards)) {
		return { cards, nextCardId };
	}
	const runtime: EffectRuntime = { config, sourceId, targetId, slotMap: plan.slotMap, cards: cards.slice(), nextCardId, removeIds: new Set<string>(), agreements: { ...agreements }, dialogueHistory: dialogueHistory.map((entry) => ({ ...entry, participantIds: [...entry.participantIds], visitedNodeIds: [...entry.visitedNodeIds], chosenOptionIds: [...entry.chosenOptionIds] })), nextAgreementId, time };
	for (let i = 0; i < plan.effects.length; i++) effectHandlers[plan.effects[i].kind](runtime, plan.effects[i]);
	applyAttributeReactions(runtime);
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
	return { cards: runtime.cards, nextCardId: runtime.nextCardId, dialogue: runtime.dialogue, agreements: runtime.agreements, dialogueHistory: runtime.dialogueHistory, nextAgreementId: runtime.nextAgreementId };
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
		if (!evaluateConditions(effect.condition, { sourceTag: tagSnapshot, host: hostSnapshot })) continue;
		const tagCondition = (conditions: ConditionExpression | ConditionExpression[]): boolean => evaluateConditions(conditions, { sourceTag: tagSnapshot, host: snapshotFromDerived(deriveCard(config, currentHost)) });
		if (effect.kind === EffectType.CHANGE_ATTRIBUTES && effect.target?.card === ConditionTarget.HOST) {
			currentHost = applyChangeAttributes(config, currentHost, effect.changes, tagCondition, {
				evaluateConditions: tagCondition,
			});
			continue;
		}
		if (effect.kind === EffectType.CHANGE_ATTRIBUTES && (effect.target?.card === ConditionTarget.SOURCE_TAG || !effect.target)) {
			const values = { ...currentTag.values };
			for (let j = 0; j < effect.changes.length; j++) {
				const change = effect.changes[j];
				if (change.condition && !tagCondition(change.condition)) continue;
				const definition = config.allAttributes.find((attribute) => attribute.id === change.attributeId);
				if (!definition) continue;
				const current = getNumberAttribute(values, change.attributeId);
				const set = change.set === undefined ? undefined : evaluateChangeNumber(change.set, values, { evaluateConditions: tagCondition });
				const delta = evaluateChangeNumber(change.delta, values, { evaluateConditions: tagCondition }, 0);
				const next = set ?? current + delta;
				values[change.attributeId] = next;
			}
			currentTag = { ...currentTag, values };
		}
	}
	return { host: currentHost, tag: currentTag };
}

function runTagAutoActions(config: FamineRefugeeConfig, card: CardState, time = 0): CardState {
	let current = card;
	for (let i = 0; i < current.tags.length; i++) {
		const tagDefinition = getTagDefinition(config, current.tags[i].tagId);
		if (!tagDefinition?.auto) continue;
		for (let j = 0; j < tagDefinition.auto.length; j++) {
			const auto = tagDefinition.auto[j];
			const hostSnapshot = snapshotFromDerived(deriveCard(config, current));
			const tagSnapshot = snapshotFromTag(current.tags[i]);
			if (!evaluateConditions(auto.condition, { sourceTag: tagSnapshot, host: hostSnapshot })) continue;
			const result = applyTagAutoEffects(config, auto.effects, current, current.tags[i]);
			const tags = current.tags.slice();
			tags[i] = result.tag;
			current = { ...result.host, tags };
		}
	}
	return applyCardAttributeReactions(config, current, time);
}

function runAutoActions(config: FamineRefugeeConfig, card: CardState, time = 0): CardState {
	let current = card;
	const template = getTemplate(config, current.templateId);
	for (let i = 0; i < (template.auto ?? []).length; i++) {
		const action = findAction(config, (template.auto ?? [])[i]);
		if (!action) continue;
		const derived = deriveCard(config, current);
		if (!evaluateConditions(action.condition, { sourceCard: snapshotFromDerived(derived, current), cards: [current], config })) continue;
		const result = applyActionEffects(config, action, current.id, [], [current], 0);
		const updated = getCard(result.cards, current.id);
		if (updated) current = updated;
	}
	return runTagAutoActions(config, current, time);
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
			if (!evaluateConditions(action.condition, { sourceCard: sourceSnapshot, cards: current.cards, config, time: current.time })) continue;
			const assignments: SlotAssignment[] = [];
			const used = new Set<string>();
			let valid = true;
			for (let j = 0; j < (action.slots ?? []).length; j++) {
				const slot = (action.slots ?? [])[j];
				const range = getSlotRange(config, slot, npc, current.cards);
				if (!range.valid) {
					valid = false;
					break;
				}
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
			const interval = Math.max(1, Math.ceil(evaluateFormula(behavior.decisionInterval, npc.values, createFormulaContext(config, current.cards))));
			const result = applyActionEffects(config, action, npc.id, assignments, current.cards, current.nextCardId);
			const nextCards = result.cards.map((card) => card.id === npc.id
				? { ...card, nextBehaviorTime: current.time + Math.max(interval, actionCost) }
				: card);
			current = appendLog({ ...current, cards: nextCards, nextCardId: result.nextCardId }, `${template.key}：${action.title}`);
			acted = true;
		}
		if (!acted) {
			const interval = Math.max(1, Math.ceil(evaluateFormula(behavior.decisionInterval, npc.values, createFormulaContext(config, current.cards))));
			current = { ...current, cards: current.cards.map((card) => card.id === npc.id ? { ...card, nextBehaviorTime: current.time + interval } : card) };
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
		if (getTemplate(config, card.templateId).cardType === CardType.PLACE) {
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
	if (state.dialogue) return [];
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
		if (evaluateConditions(action.condition, {
			sourceCard: snapshotFromDerived(sourceDerived, player),
			targetCard: snapshotFromDerived(targetDerived, target),
			cards: state.cards,
			config,
			time: state.time,
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
	if (state.dialogue) return state;
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
	if (!evaluateConditions(action.condition, {
		sourceCard: snapshotFromDerived(sourceDerived, player),
		targetCard: snapshotFromDerived(targetDerived, target),
		cards: state.cards,
		config,
		time: state.time,
	})) return state;
	const timeCost = getActionTimeCost(config, action, player, {}, state.cards);
	const result = applyActionEffects(config, action, player.id, [], state.cards, state.nextCardId, targetId, state.agreements, state.dialogueHistory, state.nextAgreementId, state.time);
	let next = appendLog({ ...state, cards: result.cards, nextCardId: result.nextCardId, dialogue: result.dialogue, agreements: result.agreements ?? state.agreements, dialogueHistory: result.dialogueHistory ?? state.dialogueHistory, nextAgreementId: result.nextAgreementId ?? state.nextAgreementId }, action.title);
	next = advanceMinutes(config, next, timeCost);
	return next;
}

function cloneFamineState(state: FamineState): FamineState {
	return {
		...state,
		cards: state.cards.map((card) => ({
			...card,
			values: Object.fromEntries(Object.entries(card.values).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value])),
			tags: card.tags.map((tag) => ({ ...tag, values: { ...tag.values } })),
		})),
		logs: [...state.logs],
		agreements: Object.fromEntries(Object.entries(state.agreements).map(([id, agreement]) => [id, { ...agreement, participants: [...agreement.participants], knownBy: [...agreement.knownBy], acceptedBy: [...agreement.acceptedBy] }])),
		dialogueHistory: state.dialogueHistory.map((entry) => ({ ...entry, participantIds: [...entry.participantIds], visitedNodeIds: [...entry.visitedNodeIds], chosenOptionIds: [...entry.chosenOptionIds] })),
		dialogue: state.dialogue ? { ...state.dialogue, slotMap: { ...state.dialogue.slotMap } } : undefined,
	};
}

function getDialogueDefinition(config: FamineRefugeeConfig, id: number): DialogueDefinition | null {
	return config.allDialogues.find((dialogue) => dialogue.id === id) ?? null;
}

function getDialogueNode(config: FamineRefugeeConfig, dialogueId: number, nodeId: string): DialogueNode | null {
	const definition = getDialogueDefinition(config, dialogueId);
	return definition?.nodes.find((node) => node.id === nodeId) ?? null;
}

function getDialogueParticipants(state: FamineState): { dialogue: DialogueState; source: CardState; target: CardState | null; slotMap: Record<string, string[]> } | null {
	if (!state.dialogue) return null;
	const source = getCard(state.cards, state.dialogue.sourceCardId);
	if (!source) return null;
	return {
		dialogue: state.dialogue,
		source,
		target: state.dialogue.targetCardId ? getCard(state.cards, state.dialogue.targetCardId) : null,
		slotMap: state.dialogue.slotMap,
	};
}

export function getDialogueSpeakerCard(state: FamineState, speaker: TargetRef): CardState | null {
	if (!state.dialogue) return null;
	if (speaker.card === ConditionTarget.SOURCE_CARD) return getCard(state.cards, state.dialogue.sourceCardId);
	if (speaker.card === ConditionTarget.TARGET_CARD) return state.dialogue.targetCardId ? getCard(state.cards, state.dialogue.targetCardId) : null;
	if (speaker.card === ConditionTarget.SLOT && speaker.slot) {
		const id = state.dialogue.slotMap[speaker.slot]?.[0];
		return id ? getCard(state.cards, id) : null;
	}
	return null;
}

export function getDialogueOptions(config: FamineRefugeeConfig, state: FamineState): DialogueOption[] {
	const participants = getDialogueParticipants(state);
	if (!participants) return [];
	const node = getDialogueNode(config, participants.dialogue.dialogueId, participants.dialogue.nodeId);
	if (!node) return [];
	const context = getConditionContext(config, node.options.flatMap((option) => option.condition ?? []), participants.source, participants.target, null, participants.slotMap, state.cards, state.agreements, state.dialogueHistory, state.time);
	return node.options.filter((option) => evaluateConditions(option.condition, context));
}

function updateDialogueHistory(
	history: DialogueHistoryEntry[],
	dialogue: DialogueState,
	nodeId: string | undefined,
	optionId: string | undefined,
	endedAtNodeId: string | undefined,
): DialogueHistoryEntry[] {
	const next = history.map((entry) => ({
		...entry,
		participantIds: [...entry.participantIds],
		visitedNodeIds: [...entry.visitedNodeIds],
		chosenOptionIds: [...entry.chosenOptionIds],
	}));
	const entry = next.find((item) =>
		item.dialogueId === dialogue.dialogueId &&
		item.initiatorId === dialogue.sourceCardId &&
		item.participantIds.includes(dialogue.sourceCardId) &&
		(dialogue.targetCardId ? item.participantIds.includes(dialogue.targetCardId) : true),
	);
	if (!entry) return next;
	if (nodeId && !entry.visitedNodeIds.includes(nodeId)) entry.visitedNodeIds.push(nodeId);
	if (optionId && !entry.chosenOptionIds.includes(optionId)) entry.chosenOptionIds.push(optionId);
	if (endedAtNodeId) entry.endedAtNodeId = endedAtNodeId;
	return next;
}

export function chooseDialogueOption(config: FamineRefugeeConfig, state: FamineState, optionId: string): FamineState {
	const participants = getDialogueParticipants(state);
	if (!participants) return state;
	const node = getDialogueNode(config, participants.dialogue.dialogueId, participants.dialogue.nodeId);
	const option = node?.options.find((item) => item.id === optionId);
	if (!option) return state;
	const context = getConditionContext(config, option.condition, participants.source, participants.target, null, participants.slotMap, state.cards, state.agreements, state.dialogueHistory, state.time);
	if (!evaluateConditions(option.condition, context)) return state;
	const assignments: SlotAssignment[] = Object.entries(participants.slotMap).map(([id, ids]) => ({
		slot: { id, desc: id },
		cards: ids.map((cardId) => getCard(state.cards, cardId)).filter((card): card is CardState => Boolean(card)),
	}));
	const synthetic: FamineAction = {
		id: 0,
		verb: "dialogueOption",
		title: option.text,
		desc: option.text,
		createdAt: 0,
		slots: [],
		effects: option.effects ?? [],
		timeCost: 0,
	};
	const result = applyActionEffects(config, synthetic, participants.source.id, assignments, state.cards, state.nextCardId, participants.target?.id, state.agreements, state.dialogueHistory, state.nextAgreementId, state.time);
	const nextDialogue = result.dialogue ?? (option.next ? { ...participants.dialogue, nodeId: option.next } : undefined);
	const dialogueHistory = updateDialogueHistory(
		result.dialogueHistory ?? state.dialogueHistory,
		participants.dialogue,
		option.next,
		option.id,
		option.next ? undefined : participants.dialogue.nodeId,
	);
	return appendLog({ ...state, cards: result.cards, nextCardId: result.nextCardId, dialogue: nextDialogue, agreements: result.agreements ?? state.agreements, dialogueHistory, nextAgreementId: result.nextAgreementId ?? state.nextAgreementId }, option.text);
}

export function advanceDialogue(config: FamineRefugeeConfig, state: FamineState): FamineState {
	const participants = getDialogueParticipants(state);
	if (!participants) return state;
	const node = getDialogueNode(config, participants.dialogue.dialogueId, participants.dialogue.nodeId);
	if (!node) return state;
	if (getDialogueOptions(config, state).length > 0) return state;
	if (node.next) {
		return {
			...state,
			dialogueHistory: updateDialogueHistory(state.dialogueHistory, participants.dialogue, node.next, undefined, undefined),
			dialogue: { ...participants.dialogue, nodeId: node.next },
		};
	}
	return {
		...state,
		dialogueHistory: updateDialogueHistory(state.dialogueHistory, participants.dialogue, undefined, undefined, participants.dialogue.nodeId),
		dialogue: undefined,
	};
}

export function previewAction(
	config: FamineRefugeeConfig,
	state: FamineState,
	actionId: number,
	targetId?: string,
	assignments: Record<string, string[]> = {},
): string[] {
	const action = findAction(config, actionId);
	if (!action) return [];
	if ((action.slots ?? []).length > 0 && Object.keys(assignments).length === 0) return ["需要先选择卡槽目标后预览"];
	const player = getPlayerCard(config, state);
	if (!player) return [];
	const before = deriveCard(config, player, state.cards).values;
	const cloned = cloneFamineState(state);
	const next = targetId
		? applyIncomingAction(config, cloned, targetId, actionId)
		: applyAction(config, cloned, actionId, assignments);
	const nextPlayer = getPlayerCard(config, next);
	if (!nextPlayer) return [];
	const after = deriveCard(config, nextPlayer, next.cards).values;
	const lines: string[] = [];
	for (let i = 0; i < config.allAttributes.length; i++) {
		const definition = config.allAttributes[i];
		if (definition.key.endsWith("Max")) continue;
		const oldValue = before[definition.id] ?? 0;
		const newValue = after[definition.id] ?? 0;
		if (Math.abs(oldValue - newValue) < 0.001) continue;
		const format = (value: number) => `${Math.round(value * 100) / 100}`;
		lines.push(`${definition.label}: ${format(oldValue)} → ${format(newValue)}`);
	}
	const oldBag = getStringListAttribute(player.values, getAttributeId(config, "backpack"));
	const newBag = getStringListAttribute(nextPlayer.values, getAttributeId(config, "backpack"));
	const added = newBag.filter((id) => !oldBag.includes(id));
	const removed = oldBag.filter((id) => !newBag.includes(id));
	for (let i = 0; i < added.length; i++) {
		const card = getCard(next.cards, added[i]);
		if (card) lines.push(`背包获得: ${getTemplate(config, card.templateId).key}`);
	}
	for (let i = 0; i < removed.length; i++) {
		const card = getCard(state.cards, removed[i]);
		if (card) lines.push(`背包失去: ${getTemplate(config, card.templateId).key}`);
	}
	if (next.time > state.time) lines.push(`时间 +${next.time - state.time} 分钟`);
	return lines.length > 0 ? lines : ["无可见变化"];
}

export function applyAction(
	config: FamineRefugeeConfig,
	state: FamineState,
	actionId: number,
	assignments: Record<string, string[]> = {},
): FamineState {
	if (state.dialogue) return state;
	const player = getPlayerCard(config, state);
	if (!player) return state;
	const action = findAction(config, actionId);
	if (!action) return state;
	const sourceDerived = deriveCard(config, player, state.cards);
	if (!evaluateConditions(action.condition, { sourceCard: snapshotFromDerived(sourceDerived, player), cards: state.cards, config, time: state.time })) return state;
	const resolved = validateAssignments(config, action, player, assignments, state.cards);
	if (!resolved) return state;

	const timeCost = getActionTimeCost(config, action, player, assignments, state.cards);
	const result = applyActionEffects(config, action, player.id, resolved, state.cards, state.nextCardId, undefined, state.agreements, state.dialogueHistory, state.nextAgreementId, state.time);
	let next = appendLog({ ...state, cards: result.cards, nextCardId: result.nextCardId, dialogue: result.dialogue, agreements: result.agreements ?? state.agreements, dialogueHistory: result.dialogueHistory ?? state.dialogueHistory, nextAgreementId: result.nextAgreementId ?? state.nextAgreementId }, action.title);
	next = advanceMinutes(config, next, timeCost);
	return next;
}
