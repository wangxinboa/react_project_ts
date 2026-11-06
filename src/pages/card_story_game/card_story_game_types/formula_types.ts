import type { Condition } from "./condition_types.ts";

/**
 * 动态数字表达式。
 * 静态数字直接使用 number，不再使用 { op: "number" }。
 */
export type FormulaNode =
	| { op: "literal"; value: number }
	| { op: "numberAttributeValue"; attributeId: number }
	| { op: "numberAttributeBound"; attributeId: number; boundary: "min" | "max" }
	| { op: "floor" | "abs"; value: Formula }
	| { op: "add" | "sub" | "mul" | "div"; args: Formula[] }
	| { op: "clamp"; value: Formula; min: Formula; max: Formula }
	| { op: "normalize"; attributeId: number; min: Formula; max: Formula }
	| { op: "refListsAttributeSum"; refAttributeId: number; valueAttributeId: number }
	| { op: "refListsAttributeCount"; refAttributeId: number };

/** 公式 = 动态节点 + 可选条件。 */
export type Formula = FormulaNode & {
	conditions?: Condition[];
};

/** 静态数字或动态公式。 */
export type NumberExpression = number | Formula;

/** 公式结构校验错误。 */
export interface FormulaValidationIssue {
	path: string;
	message: string;
}
