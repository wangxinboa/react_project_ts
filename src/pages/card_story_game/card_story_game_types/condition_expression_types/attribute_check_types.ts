import type { NumberExpression } from "../formula_types.ts";
import type { TargetRef } from "./target_ref.ts";
import type { BaseNumberCheck } from "./base_number_check_types.ts";
import type { ConditionExpression } from "./condition_expression_types.ts";

/** 有向关系边：source → target。 */
export interface RelationshipRef {
	source: TargetRef;
	target: TargetRef;
}

/** 属性检查种类。 */
export const AttributeCheckType = {
	BASE_NUMBER: "baseNumber",
	DERIVED_NUMBER: "derivedNumber",
	RELATIONSHIP_NUMBER: "relationshipNumber",
	CARD_REF: "cardRef",
	CARD_REF_LIST: "cardRefList",
} as const;

export type AttributeCheckType = (typeof AttributeCheckType)[keyof typeof AttributeCheckType];

/** 所有属性检查共有的存在性判断。 */
export interface AttributeExistenceFields {
	/** 该卡是否拥有该属性；只判断存在，不判断数值 */
	hasAttribute?: number;
	/** 该卡是否同时拥有这些属性 */
	hasAttributes?: number[];
	/** 该卡是否至少拥有其中一个属性 */
	hasAnyAttribute?: number[];
}

/** 卡牌基础数值属性比较。 */
export type BaseNumberAttributeCheck = BaseNumberCheck & AttributeExistenceFields & {
	type: typeof AttributeCheckType.BASE_NUMBER;
	attributeId: number;
};

/** 卡牌派生数值属性比较。 */
export type DerivedNumberAttributeCheck = BaseNumberCheck & AttributeExistenceFields & {
	type: typeof AttributeCheckType.DERIVED_NUMBER;
	attributeId: number;
};

/** 关系边数值属性比较。 */
export type RelationshipNumberAttributeCheck = BaseNumberCheck & AttributeExistenceFields & {
	type: typeof AttributeCheckType.RELATIONSHIP_NUMBER;
	attributeId: number;
	relationship: RelationshipRef;
};

/** 卡牌引用属性存在性比较。 */
export type CardRefAttributeCheck = AttributeExistenceFields & {
	type: typeof AttributeCheckType.CARD_REF;
	attributeId: number;
	refExists: boolean;
};

/** 卡牌引用列表匹配。 */
export type CardRefListAttributeCheck = AttributeExistenceFields & {
	type: typeof AttributeCheckType.CARD_REF_LIST;
	attributeId: number;
	/** cardRefList 引用卡匹配；condition 内用 referencedCard 指向当前引用卡 */
	refListsMatch?: {
		condition?: ConditionExpression;
		/** 匹配数量下限；未写 count 时生效 */
		min?: NumberExpression;
		/** 匹配数量上限；未写 count 时生效 */
		max?: NumberExpression;
		/** 精确匹配数量；求值后 floor 且非负，优先于 min/max */
		count?: NumberExpression;
	};
};

/** 属性检查；值判断和存在性判断统一放在同一数组内。 */
export type AttributeCheck =
	| BaseNumberAttributeCheck
	| DerivedNumberAttributeCheck
	| RelationshipNumberAttributeCheck
	| CardRefAttributeCheck
	| CardRefListAttributeCheck;
