import { isPlainObject } from "../../../utils/type_guard.ts";
import type { FormulaValidationIssue } from "../card_story_game_types/formula_types.ts";
import { FormulaOp } from "../card_story_game_types/formula_types.ts";

function isFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

function isAttributeId(value: unknown): value is number {
	return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function validateFormula(raw: unknown, path = "formula"): FormulaValidationIssue[] {
	const issues: FormulaValidationIssue[] = [];
	validateNode(raw, path, issues);
	return issues;
}

function validateNode(raw: unknown, path: string, issues: FormulaValidationIssue[]): void {
	if (isFiniteNumber(raw)) return;
	if (!isPlainObject(raw)) {
		issues.push({ path, message: "必须是数字或对象" });
		return;
	}

	const op = raw.op;
	if (typeof op !== "string") {
		issues.push({ path: `${path}.op`, message: "必须是字符串" });
		return;
	}

	switch (op) {
		case FormulaOp.LITERAL:
			if (!isFiniteNumber(raw.value)) {
				issues.push({ path: `${path}.value`, message: "必须是有限数字" });
			}
			return;
		case FormulaOp.FLOOR:
		case FormulaOp.ABS:
			validateNode(raw.value, `${path}.value`, issues);
			return;
		case FormulaOp.NUMBER_ATTRIBUTE_VALUE:
			if (!isAttributeId(raw.attributeId)) {
				issues.push({ path: `${path}.attributeId`, message: "必须是正整数属性 id" });
			}
			return;
		case FormulaOp.ADD:
		case FormulaOp.SUB:
		case FormulaOp.MUL:
		case FormulaOp.DIV: {
			if (!Array.isArray(raw.args) || raw.args.length === 0) {
				issues.push({ path: `${path}.args`, message: "必须是非空数组" });
				return;
			}
			for (let i = 0; i < raw.args.length; i++) {
				validateNode(raw.args[i], `${path}.args[${i}]`, issues);
			}
			return;
		}
		case FormulaOp.CLAMP:
			validateNode(raw.value, `${path}.value`, issues);
			validateNode(raw.min, `${path}.min`, issues);
			validateNode(raw.max, `${path}.max`, issues);
			return;
		case FormulaOp.REF_LISTS_ATTRIBUTE_SUM:
			if (!isAttributeId(raw.refAttributeId)) {
				issues.push({ path: `${path}.refAttributeId`, message: "必须是正整数属性 id" });
			}
			if (!isAttributeId(raw.valueAttributeId)) {
				issues.push({ path: `${path}.valueAttributeId`, message: "必须是正整数属性 id" });
			}
			return;
		case FormulaOp.REF_LISTS_ATTRIBUTE_COUNT:
			if (!isAttributeId(raw.refAttributeId)) {
				issues.push({ path: `${path}.refAttributeId`, message: "必须是正整数属性 id" });
			}
			return;
		case FormulaOp.NORMALIZE:
			if (!isAttributeId(raw.attributeId)) {
				issues.push({ path: `${path}.attributeId`, message: "必须是正整数属性 id" });
			}
			validateNode(raw.min, `${path}.min`, issues);
			validateNode(raw.max, `${path}.max`, issues);
			return;
		case FormulaOp.SELECT: {
			if (!Array.isArray(raw.branches) || raw.branches.length === 0) {
				issues.push({ path: `${path}.branches`, message: "必须是非空数组" });
				return;
			}
			for (let i = 0; i < raw.branches.length; i++) {
				const branch = raw.branches[i];
				if (!isPlainObject(branch)) {
					issues.push({ path: `${path}.branches[${i}]`, message: "必须是对象" });
					continue;
				}
				validateNode(branch.value, `${path}.branches[${i}].value`, issues);
			}
			if (raw.else !== undefined) validateNode(raw.else, `${path}.else`, issues);
			return;
		}
		default:
			issues.push({ path: `${path}.op`, message: `未知操作：${op}` });
	}
}
