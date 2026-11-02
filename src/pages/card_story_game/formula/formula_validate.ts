import { isPlainObject } from "../../../utils/type_guard.ts";
import type { FormulaValidationIssue } from "../card_story_game_types/formula_types.ts";

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
	if (!isPlainObject(raw)) {
		issues.push({ path, message: "必须是对象" });
		return;
	}

	const op = raw.op;
	if (typeof op !== "string") {
		issues.push({ path: `${path}.op`, message: "必须是字符串" });
		return;
	}

	switch (op) {
		case "number":
			if (!isFiniteNumber(raw.value)) {
				issues.push({ path: `${path}.value`, message: "必须是有限数字" });
			}
			return;
		case "attr":
			if (!isAttributeId(raw.id)) {
				issues.push({ path: `${path}.id`, message: "必须是正整数属性 id" });
			}
			return;
		case "add":
		case "sub":
		case "mul":
		case "div": {
			if (!Array.isArray(raw.args) || raw.args.length === 0) {
				issues.push({ path: `${path}.args`, message: "必须是非空数组" });
				return;
			}
			for (let i = 0; i < raw.args.length; i++) {
				validateNode(raw.args[i], `${path}.args[${i}]`, issues);
			}
			return;
		}
		case "clamp": {
			if (!isFiniteNumber(raw.min) || !isFiniteNumber(raw.max)) {
				issues.push({ path: `${path}.min/max`, message: "必须是有限数字" });
			} else if (raw.min > raw.max) {
				issues.push({ path: `${path}.min/max`, message: "min 不能大于 max" });
			}
			validateNode(raw.value, `${path}.value`, issues);
			return;
		}
		case "normalize":
			if (!isAttributeId(raw.id)) {
				issues.push({ path: `${path}.id`, message: "必须是正整数属性 id" });
			}
			if (!isFiniteNumber(raw.min) || !isFiniteNumber(raw.max)) {
				issues.push({ path: `${path}.min/max`, message: "必须是有限数字" });
			} else if (raw.min >= raw.max) {
				issues.push({ path: `${path}.min/max`, message: "min 必须小于 max" });
			}
			return;
		default:
			issues.push({ path: `${path}.op`, message: `未知操作：${op}` });
	}
}
