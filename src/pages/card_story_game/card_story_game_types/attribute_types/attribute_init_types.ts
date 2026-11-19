import type { RelationshipRef } from "../condition_expression_types/attribute_check_types.ts";
import type { TargetRef } from "../condition_expression_types/target_ref.ts";
import type { NumberExpression } from "../formula_types.ts";

/** cardRef 属性可写入的值。 */
export type CardRefValue =
	| { card: TargetRef }
	| { copyCardRef: { card: TargetRef; attributeId: number } }
	| { literal: string }
	| null;

/** 属性初始化种类。 */
export const AttributeInitType = {
	INIT_BASE_NUMBER: "initBaseNumber",
	INIT_DERIVED_NUMBER: "initDerivedNumber",
	INIT_CARD_REF: "initCardRef",
	INIT_CARD_REF_LIST: "initCardRefList",
	INIT_RELATIONSHIP_NUMBER: "initRelationshipNumber",
} as const;

export type AttributeInitType = (typeof AttributeInitType)[keyof typeof AttributeInitType];

/** 基础数值属性初始化。 */
export interface BaseNumberInit {
	type: typeof AttributeInitType.INIT_BASE_NUMBER;
	attributeId: number;
	value: NumberExpression;
}

/** 派生数值属性占位初始化。 */
export interface DerivedNumberInit {
	type: typeof AttributeInitType.INIT_DERIVED_NUMBER;
	attributeId: number;
}

/** 卡牌引用属性初始化。 */
export interface CardRefInit {
	type: typeof AttributeInitType.INIT_CARD_REF;
	attributeId: number;
	value: CardRefValue;
}

/** 卡牌引用列表属性初始化。 */
export interface CardRefListInit {
	type: typeof AttributeInitType.INIT_CARD_REF_LIST;
	attributeId: number;
	value: TargetRef[];
}

/** 关系数值属性初始化。 */
export interface RelationshipNumberInit {
	type: typeof AttributeInitType.INIT_RELATIONSHIP_NUMBER;
	attributeId: number;
	relationship: RelationshipRef;
	value: number;
}

/** 运行时属性实例初始化。 */
export type AttributeInit =
	| BaseNumberInit
	| DerivedNumberInit
	| CardRefInit
	| CardRefListInit
	| RelationshipNumberInit;

/**
 * 模板初始化。
 * 模板没有运行时卡牌/动作上下文，无法安全求值动态公式；
 * 因此 baseNumber 只允许静态数字，避免模板公式依赖尚不存在的实例状态。
 */
export type TemplateAttributeInit =
	| (Omit<BaseNumberInit, "value"> & { value: number })
	| DerivedNumberInit;
