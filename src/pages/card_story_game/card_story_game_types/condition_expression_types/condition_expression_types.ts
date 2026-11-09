import type { Condition } from "./condition_types.ts";

/** AND / OR 组合。子条件使用 items，避免与旧 conditions 字段混淆。 */
export interface ConditionGroup {
	kind: "and" | "or";
	items: ConditionExpression[];
}

/** 逻辑取反。 */
export interface ConditionNot {
	kind: "not";
	item: ConditionExpression;
}

/** 条件表达式：叶子条件或逻辑组合。 */
export type ConditionExpression =
	| Condition
	| ConditionGroup
	| ConditionNot;
