import type { Condition } from "./condition_types.ts";

/**
 * 公式 AST 节点。
 * 所有节点都可以带 conditions；条件不满足时该节点按 0 计算。
 */
export type FormulaNode =
	| { op: "number"; value: number }
	| { op: "attr"; attributeId: number }
	| { op: "add" | "sub" | "mul" | "div"; args: Formula[] }
	| { op: "clamp"; value: Formula; min: number; max: number }
	| { op: "normalize"; attributeId: number; min: number; max: number }
	| { op: "refListsAttributeSum"; refAttributeId: number; valueAttributeId: number }
	| { op: "refListsAttributeCount"; refAttributeId: number };

/** 公式 = AST 节点 + 可选条件。 */
export type Formula = FormulaNode & {
	conditions?: Condition[];
};

/** 公式结构校验错误。 */
export interface FormulaValidationIssue {
	path: string;
	message: string;
}
