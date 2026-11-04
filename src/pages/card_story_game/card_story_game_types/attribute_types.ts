import type { Formula } from "./formula_types.ts";

/** 属性值：number / cardRef / cardRefList。 */
export type AttributeValue = number | string | string[];

export type AttributeValueType = "number" | "cardRef" | "cardRefList";

/** 模板/标签上的属性初始绑定。 */
export interface AttributeBinding {
	id: number;
	value: AttributeValue;
}

/** number 类型属性的专属参数。其他 valueType 以后可以有各自的参数对象。 */
export interface NumberAttributeTypeParams {
	min?: number;
	max?: number;
}

/** 全局属性定义，卡牌模板和标签共用。 */
export interface AttributeDefinition {
	id: number;
	key: string;
	label?: string;
	desc: string;
	kind: "base" | "derived";
	valueType: AttributeValueType;
	/** number 类型专属参数，例如范围 */
	typeParams?: NumberAttributeTypeParams;
	/** false 表示内部属性，不在卡牌属性面板展示 */
	visible?: boolean;
	/** derived 属性的计算公式 */
	formula?: Formula;
}
