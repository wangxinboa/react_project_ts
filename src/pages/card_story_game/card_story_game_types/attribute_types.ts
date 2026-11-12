import type { Formula, NumberExpression } from "./formula_types.ts";

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

export interface NumberBounds {
	/** 硬下界，写入时不得低于 */
	min?: NumberExpression;
	/** 硬上界，写入时不得高于 */
	max?: NumberExpression;
}

/** number 类型属性的专属参数。其他 valueType 以后可以有各自的参数对象。 */
export interface NumberAttributeTypeParams {
	bounds?: NumberBounds;
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
	/** number 类型专属参数，例如范围 */
	typeParams?: NumberAttributeTypeParams;
	/** false 表示内部属性，不在卡牌属性面板展示 */
	visible?: boolean;
	/** derived 属性的计算公式 */
	formula?: Formula;
}
