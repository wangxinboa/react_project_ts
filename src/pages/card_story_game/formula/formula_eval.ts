import type { Condition } from "../card_story_game_types/index.ts";
import type { Formula } from "../card_story_game_types/formula_types.ts";

export interface FormulaContext {
	evaluateConditions?: (conditions: Condition[]) => boolean;
}

export function evaluateFormula(
	formula: Formula,
	values: Record<number, number>,
	context?: FormulaContext,
): number {
	if (formula.conditions && formula.conditions.length > 0) {
		if (!context?.evaluateConditions || !context.evaluateConditions(formula.conditions)) return 0;
	}
	switch (formula.op) {
		case "number":
			return formula.value;
		case "attr":
			return values[formula.id] ?? 0;
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
		case "clamp":
			return Math.min(formula.max, Math.max(formula.min, evaluateFormula(formula.value, values, context)));
		case "normalize": {
			const range = formula.max - formula.min;
			if (range === 0) return 0;
			const raw = values[formula.id] ?? 0;
			return (raw - formula.min) / range;
		}
	}
}
