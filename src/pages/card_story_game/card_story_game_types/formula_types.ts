import type { ConditionExpression } from "./condition_expression_types/condition_expression_types.ts";

export const FormulaOp = {
	LITERAL: "literal",
	NUMBER_ATTRIBUTE_VALUE: "numberAttributeValue",
	FLOOR: "floor",
	ABS: "abs",
	ADD: "add",
	SUB: "sub",
	MUL: "mul",
	DIV: "div",
	CLAMP: "clamp",
	NORMALIZE: "normalize",
	REF_LISTS_ATTRIBUTE_SUM: "refListsAttributeSum",
	REF_LISTS_ATTRIBUTE_COUNT: "refListsAttributeCount",
	SELECT: "select",
} as const;

export type FormulaOp = (typeof FormulaOp)[keyof typeof FormulaOp];

/**
 * 动态数字表达式。
 * 静态数字直接使用 number，不再使用 { op: "number" }。
 */
export interface FormulaBranch {
	condition: ConditionExpression;
	value: Formula;
}

export type FormulaNode =
	| { op: typeof FormulaOp.LITERAL; value: number }
	| { op: typeof FormulaOp.NUMBER_ATTRIBUTE_VALUE; attributeId: number }
	| { op: typeof FormulaOp.FLOOR | typeof FormulaOp.ABS; value: Formula }
	| { op: typeof FormulaOp.ADD | typeof FormulaOp.SUB | typeof FormulaOp.MUL | typeof FormulaOp.DIV; args: Formula[] }
	| { op: typeof FormulaOp.CLAMP; value: Formula; min: Formula; max: Formula }
	| { op: typeof FormulaOp.NORMALIZE; attributeId: number; min: Formula; max: Formula }
	| { op: typeof FormulaOp.REF_LISTS_ATTRIBUTE_SUM; refAttributeId: number; valueAttributeId: number }
	| { op: typeof FormulaOp.REF_LISTS_ATTRIBUTE_COUNT; refAttributeId: number }
	| { op: typeof FormulaOp.SELECT; branches: FormulaBranch[]; else?: Formula };

/** 公式 = 动态节点 + 可选条件。 */
export type Formula = FormulaNode & {
	condition?: ConditionExpression;
};

/** 静态数字或动态公式。 */
export type NumberExpression = number | Formula;

/** 公式结构校验错误。 */
export interface FormulaValidationIssue {
	path: string;
	message: string;
}
