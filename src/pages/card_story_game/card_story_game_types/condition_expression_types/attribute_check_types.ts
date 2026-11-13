import type { NumberExpression } from "../formula_types.ts";
import type { TargetRef } from "./target_ref.ts";
import type { BaseNumberCheck } from "./base_number_check_types.ts";
import type { ConditionExpression } from "./condition_expression_types.ts";

/** 有向关系边：source → target。 */
export interface RelationshipRef {
	source: TargetRef;
	target: TargetRef;
}

/** 单个属性的比较条件。 */
export interface AttributeCheck extends BaseNumberCheck {
	/** number 属性 id */
	id?: number;
	/** 关系属性 id；必须和 relationship 一起使用 */
	relationshipId?: number;
	/** 关系边 source → target */
	relationship?: RelationshipRef;
	/** cardRef 属性 id */
	refId?: number;
	/** cardRefList 属性 id */
	refListId?: number;
	/** cardRef 是否存在 */
	refExists?: boolean;
	/** 该卡是否拥有该属性；只判断存在，不判断数值 */
	hasAttribute?: number;
	/** 该卡是否同时拥有这些属性 */
	hasAttributes?: number[];
	/** 该卡是否至少拥有其中一个属性 */
	hasAnyAttribute?: number[];
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
}
