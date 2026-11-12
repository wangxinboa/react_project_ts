import type { Condition } from "./condition_types.ts";

export const ConditionGroupKind = {
	AND: "and",
	OR: "or",
} as const;

export type ConditionGroupKind = (typeof ConditionGroupKind)[keyof typeof ConditionGroupKind];

export const ConditionNotKind = {
	NOT: "not",
} as const;

export type ConditionNotKind = (typeof ConditionNotKind)[keyof typeof ConditionNotKind];

/** AND / OR 组合。子条件使用 items，避免与旧 conditions 字段混淆。 */
export interface ConditionGroup {
	kind: ConditionGroupKind;
	/** 给编辑者看的条件说明，不参与运行时判断 */
	desc?: string;
	items: ConditionExpression[];
}

/** 逻辑取反。 */
export interface ConditionNot {
	kind: ConditionNotKind;
	/** 给编辑者看的条件说明，不参与运行时判断 */
	desc?: string;
	item: ConditionExpression;
}

/** 条件表达式：叶子条件或逻辑组合。 */
export type ConditionExpression =
	| Condition
	| ConditionGroup
	| ConditionNot;
