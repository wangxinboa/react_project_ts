import type { ConditionExpression } from "../../condition_expression_types/condition_expression_types.ts";
import type { RelationshipRef } from "../../condition_expression_types/attribute_check_types.ts";
import type { TargetRef } from "../../condition_expression_types/target_ref.ts";
import type { NumberExpression } from "../../formula_types.ts";
import { EffectType } from "../effect_types.ts";
import type { CardRefValue } from "../../attribute_types/attribute_init_types.ts";

/** 属性修改种类。 */
export const AttributeChangeType = {
	CHANGE_BASE_NUMBER: "changeBaseNumber",
	CHANGE_RELATIONSHIP_NUMBER: "changeRelationshipNumber",
	CHANGE_CARD_REF: "changeCardRef",
	CHANGE_CARD_REF_LIST: "changeCardRefList",
} as const;

export type AttributeChangeType = (typeof AttributeChangeType)[keyof typeof AttributeChangeType];

/** 卡牌基础数值属性的增量或覆盖。 */
export interface BaseNumberAttributeChange {
	type: typeof AttributeChangeType.CHANGE_BASE_NUMBER;
	attributeId: number;
	add?: NumberExpression;
	sub?: NumberExpression;
	set?: NumberExpression;
	condition?: ConditionExpression;
}

/** 关系边数值属性的增量或覆盖。 */
export interface RelationshipNumberAttributeChange {
	type: typeof AttributeChangeType.CHANGE_RELATIONSHIP_NUMBER;
	attributeId: number;
	relationship: RelationshipRef;
	add?: NumberExpression;
	sub?: NumberExpression;
	set?: NumberExpression;
	condition?: ConditionExpression;
}

/** 卡牌引用属性的覆盖。 */
export interface CardRefAttributeChange {
	type: typeof AttributeChangeType.CHANGE_CARD_REF;
	attributeId: number;
	value: CardRefValue;
	condition?: ConditionExpression;
}

/** 卡牌引用列表的增删。 */
export interface CardRefListAttributeChange {
	type: typeof AttributeChangeType.CHANGE_CARD_REF_LIST;
	attributeId: number;
	add?: TargetRef[];
	remove?: TargetRef[];
	condition?: ConditionExpression;
}

/** 单个属性修改；具体语义由 type 决定。 */
export type CardAttributeChange =
	| BaseNumberAttributeChange
	| RelationshipNumberAttributeChange
	| CardRefAttributeChange
	| CardRefListAttributeChange;

/** 批量修改属性；每项自己声明属性类型。 */
export type ChangeCardAttributesEffect = {
	kind: typeof EffectType.CHANGE_ATTRIBUTES;
	changes: CardAttributeChange[];
};
