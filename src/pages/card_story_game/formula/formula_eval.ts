import type { AttributeValue, Condition } from "../card_story_game_types/index.ts";
import { getNumberAttribute } from "../game/famine_refugee/attribute_value.ts";
import type { NumberExpression } from "../card_story_game_types/formula_types.ts";

export interface FormulaContext {
	evaluateConditions?: (conditions: Condition[]) => boolean;
	/** 通过 cardRef / cardRefList 中的 id 查找卡牌 */
	resolveCard?: (id: string) => { values: Record<number, AttributeValue> } | null;
	/** 解析属性硬边界 */
	getAttributeBound?: (attributeId: number, boundary: "min" | "max", values: Record<number, AttributeValue>) => number | undefined;
}

export function evaluateFormula(
	formula: NumberExpression,
	values: Record<number, AttributeValue>,
	context?: FormulaContext,
): number {
	if (typeof formula === "number") return formula;
	if (formula.conditions && formula.conditions.length > 0) {
		if (!context?.evaluateConditions || !context.evaluateConditions(formula.conditions)) return 0;
	}
	switch (formula.op) {
		case "literal":
			return formula.value;
		case "numberAttributeValue":
			return getNumberAttribute(values, formula.attributeId);
		case "numberAttributeBound":
			return context?.getAttributeBound?.(formula.attributeId, formula.boundary, values) ?? 0;
		case "floor":
			return Math.floor(evaluateFormula(formula.value, values, context));
		case "abs":
			return Math.abs(evaluateFormula(formula.value, values, context));
		case "add": {
			let total = 0;
			for (let i = 0; i < formula.args.length; i++) {
				total += evaluateFormula(formula.args[i], values, context);
			}
			return total;
		}
		case "sub": {
			if (formula.args.length === 0) return 0;
			let total = evaluateFormula(formula.args[0], values, context);
			for (let i = 1; i < formula.args.length; i++) {
				total -= evaluateFormula(formula.args[i], values, context);
			}
			return total;
		}
		case "mul": {
			let total = 1;
			for (let i = 0; i < formula.args.length; i++) {
				total *= evaluateFormula(formula.args[i], values, context);
			}
			return total;
		}
		case "div": {
			if (formula.args.length === 0) return 0;
			let total = evaluateFormula(formula.args[0], values, context);
			for (let i = 1; i < formula.args.length; i++) {
				const divisor = evaluateFormula(formula.args[i], values, context);
				total = divisor === 0 ? 0 : total / divisor;
			}
			return total;
		}
		case "refListsAttributeSum": {
			const list = values[formula.refAttributeId];
			if (!Array.isArray(list) || !context?.resolveCard) return 0;
			let total = 0;
			for (let i = 0; i < list.length; i++) {
				const id = list[i];
				if (typeof id !== "string") continue;
				const card = context.resolveCard(id);
				if (card) total += getNumberAttribute(card.values, formula.valueAttributeId);
			}
			return total;
		}
		case "refListsAttributeCount": {
			const list = values[formula.refAttributeId];
			return Array.isArray(list) ? list.length : 0;
		}
		case "clamp": {
			const min = evaluateFormula(formula.min, values, context);
			const max = evaluateFormula(formula.max, values, context);
			return Math.min(max, Math.max(min, evaluateFormula(formula.value, values, context)));
		}
		case "normalize": {
			const min = evaluateFormula(formula.min, values, context);
			const max = evaluateFormula(formula.max, values, context);
			const range = max - min;
			if (range === 0) return 0;
			const raw = getNumberAttribute(values, formula.attributeId);
			return (raw - min) / range;
		}
	}
}
