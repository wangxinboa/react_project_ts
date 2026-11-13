import type { ConditionExpression } from "./condition_types.ts";
import type { EffectCall } from "./effect_types/effect_types.ts";
import type { Formula } from "./formula_types.ts";

/** 属性值：number / cardRef / cardRefList。 */
export type AttributeValue = number | string | string[];

export const AttributeValueType = {
	NUMBER: "number",
	CARD_REF: "cardRef",
	CARD_REF_LIST: "cardRefList",
} as const;

export type AttributeValueType = (typeof AttributeValueType)[keyof typeof AttributeValueType];

export const AttributeScope = {
	CARD: "card",
	RELATIONSHIP: "relationship",
} as const;

export type AttributeScope = (typeof AttributeScope)[keyof typeof AttributeScope];

export const AttributeKind = {
	BASE: "base",
	DERIVED: "derived",
} as const;

export type AttributeKind = (typeof AttributeKind)[keyof typeof AttributeKind];

/** 模板/标签上的属性初始绑定。 */
export interface AttributeBinding {
	id: number;
	value: AttributeValue;
}

/** 属性变化后的反应；数组顺序即优先级。 */
export interface AttributeReaction {
	condition: ConditionExpression;
	effects: EffectCall[];
}

/** 全局属性定义，卡牌模板和标签共用。 */
export interface AttributeDefinition {
	id: number;
	key: string;
	label?: string;
	desc: string;
	/** 默认 card；relationship 表示关系边属性 */
	scope?: AttributeScope;
	kind: AttributeKind;
	valueType: AttributeValueType;
	/** derived 属性的计算公式 */
	formula?: Formula;
	/** 属性写入后的反应 */
	reactions?: AttributeReaction[];
}
