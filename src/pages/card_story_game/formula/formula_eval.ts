import type { AttributeValue, ConditionExpression } from "../card_story_game_types/index.ts";
import { getNumberAttribute } from "../game/famine_refugee/attribute_value.ts";
import type { NumberExpression } from "../card_story_game_types/formula_types.ts";
import { FormulaOp } from "../card_story_game_types/formula_types.ts";

export interface FormulaContext {
	evaluateConditions?: (conditions: ConditionExpression[]) => boolean;
	/** 通过 cardRef / cardRefList 中的 id 查找卡牌 */
	resolveCard?: (id: string) => { values: Record<number, AttributeValue> } | null;
	/** 解析属性硬边界 */
}

export function evaluateFormula(
	formula: NumberExpression,
	values: Record<number, AttributeValue>,
	context?: FormulaContext,
): number {
	if (typeof formula === "number") return formula;
	if (formula.condition) {
		if (!context?.evaluateConditions || !context.evaluateConditions([formula.condition])) return 0;
	}
	switch (formula.op) {
		case FormulaOp.LITERAL:
			return formula.value;
		case FormulaOp.NUMBER_ATTRIBUTE_VALUE:
			return getNumberAttribute(values, formula.attributeId);
		case FormulaOp.FLOOR:
			return Math.floor(evaluateFormula(formula.value, values, context));
		case FormulaOp.ABS:
			return Math.abs(evaluateFormula(formula.value, values, context));
		case FormulaOp.ADD: {
			let total = 0;
			for (let i = 0; i < formula.args.length; i++) {
				total += evaluateFormula(formula.args[i], values, context);
			}
			return total;
		}
		case FormulaOp.SUB: {
			if (formula.args.length === 0) return 0;
			let total = evaluateFormula(formula.args[0], values, context);
			for (let i = 1; i < formula.args.length; i++) {
				total -= evaluateFormula(formula.args[i], values, context);
			}
			return total;
		}
		case FormulaOp.MUL: {
			let total = 1;
			for (let i = 0; i < formula.args.length; i++) {
				total *= evaluateFormula(formula.args[i], values, context);
			}
			return total;
		}
		case FormulaOp.DIV: {
			if (formula.args.length === 0) return 0;
			let total = evaluateFormula(formula.args[0], values, context);
			for (let i = 1; i < formula.args.length; i++) {
				const divisor = evaluateFormula(formula.args[i], values, context);
				total = divisor === 0 ? 0 : total / divisor;
			}
			return total;
		}
		case FormulaOp.REF_LISTS_ATTRIBUTE_SUM: {
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
		case FormulaOp.REF_LISTS_ATTRIBUTE_COUNT: {
			const list = values[formula.refAttributeId];
			return Array.isArray(list) ? list.length : 0;
		}
		case FormulaOp.CLAMP: {
			const min = evaluateFormula(formula.min, values, context);
			const max = evaluateFormula(formula.max, values, context);
			return Math.min(max, Math.max(min, evaluateFormula(formula.value, values, context)));
		}
		case FormulaOp.NORMALIZE: {
			const min = evaluateFormula(formula.min, values, context);
			const max = evaluateFormula(formula.max, values, context);
			const range = max - min;
			if (range === 0) return 0;
			const raw = getNumberAttribute(values, formula.attributeId);
			return (raw - min) / range;
		}
		case FormulaOp.MAX: {
			if (formula.args.length === 0) return 0;
			let result = evaluateFormula(formula.args[0], values, context);
			for (let i = 1; i < formula.args.length; i++) result = Math.max(result, evaluateFormula(formula.args[i], values, context));
			return result;
		}
		case FormulaOp.MIN: {
			if (formula.args.length === 0) return 0;
			let result = evaluateFormula(formula.args[0], values, context);
			for (let i = 1; i < formula.args.length; i++) result = Math.min(result, evaluateFormula(formula.args[i], values, context));
			return result;
		}
		case FormulaOp.SELECT: {
			for (let i = 0; i < formula.branches.length; i++) {
				const branch = formula.branches[i];
				if (context?.evaluateConditions?.([branch.condition])) {
					return evaluateFormula(branch.value, values, context);
				}
			}
			return formula.else === undefined ? 0 : evaluateFormula(formula.else, values, context);
		}
	}
}
