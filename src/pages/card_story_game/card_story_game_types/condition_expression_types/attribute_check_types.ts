import type { NumberExpression } from "../formula_types.ts";
import type { RelationshipRef } from "./relationship_types.ts";
import type { ConditionExpression } from "./condition_expression_types.ts";

/** 单个属性的比较条件。 */
export type AttributeCheck = {
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
	/** 大于 */
	gt?: NumberExpression;
	/** 大于等于 */
	gte?: NumberExpression;
	/** 小于 */
	lt?: NumberExpression;
	/** 小于等于 */
	lte?: NumberExpression;
	/** 等于 */
	eq?: NumberExpression;
	/** cardRef 是否存在 */
	refExists?: boolean;
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
