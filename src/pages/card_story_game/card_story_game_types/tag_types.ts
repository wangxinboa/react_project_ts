import type { AttributeBinding } from "./attribute_types.ts";
import type { ConditionExpression } from "./condition_expression_types/condition_expression_types.ts";
import type { EffectCall } from "./effect_types/effect_types.ts";

/**
 * state：可附着、可增删、可带自身属性的状态标签；
 * derived：每次 derive 根据 condition 计算出的只读标签。
 */
export const TagKind = {
	STATE: "state",
	DERIVED: "derived",
} as const;

export type TagKind = (typeof TagKind)[keyof typeof TagKind];

/** state 标签的每小时自动效果。 */
export interface TagAuto {
	/** 判断 sourceTag（标签自身）和 host（宿主卡）的条件 */
	condition?: ConditionExpression;
	/** 作用到 source / host 的效果列表 */
	effects: EffectCall[];
}

/** 标签定义。 */
export interface TagItem {
	id: number;
	key: string;
	desc: string;
	/** Editor 旧数据/UI 排序使用，运行时标签可以不存 */
	createdAt?: number;
	kind?: TagKind;
	/** derived 标签的判定条件 */
	condition?: ConditionExpression;
	/** state 标签自身的属性绑定 */
	attributes?: AttributeBinding[];
	/** state 标签每小时执行的自定义效果 */
	auto?: TagAuto[];
}
