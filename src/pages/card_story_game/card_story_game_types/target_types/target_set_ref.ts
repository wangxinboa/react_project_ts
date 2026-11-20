import type { ConditionExpression } from "../condition_expression_types/condition_expression_types.ts";
import type { TargetCardType } from "./target_ref.ts";

/** TargetSetRef 的选取方式。 */
export const TargetSetSelect = {
	ALL: "all",
	FIRST: "first",
	LAST: "last",
} as const;

export type TargetSetSelect = (typeof TargetSetSelect)[keyof typeof TargetSetSelect];

/** 从卡牌引用列表展开目标；用于 effect 的多目标作用。 */
export interface TargetSetRef {
	card: TargetCardType;
	/** 基础目标为 slot 时指定卡槽 */
	slot?: string;
	/** 基础目标为 createdCard 时指定 addCard effect id */
	effectId?: number;
	/** 从基础目标的这个 cardRefList 属性展开 */
	cardRefListAttributeId: number;
	/** 过滤条件；候选卡绑定为 referencedCard */
	where?: ConditionExpression;
	/** 默认 all */
	select?: TargetSetSelect;
}
