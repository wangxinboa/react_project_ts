import type { ConditionExpression } from "../condition_expression_types/condition_expression_types.ts";
import type { RelationshipRef } from "../condition_expression_types/attribute_check_types.ts";
import type { NumberExpression } from "../formula_types.ts";
import { EffectType } from "./effect_kind_types.ts";

/** 单个属性的增量或覆盖。 */
export interface ChangeAttributeChange {
	attributeId: number;
	delta?: NumberExpression;
	set?: NumberExpression;
	/** 单条属性修改的条件；不满足时跳过这条修改 */
	condition?: ConditionExpression;
}

/** 批量修改属性。 */
export type ChangeAttributesEffect = {
	kind: typeof EffectType.CHANGE_ATTRIBUTES;
	changes: ChangeAttributeChange[];
};

/** 修改 sourceCard → targetCard 的关系属性。 */
export type ChangeRelationshipAttributesEffect = {
	kind: typeof EffectType.CHANGE_RELATIONSHIP_ATTRIBUTES;
	relationship: RelationshipRef;
	changes: ChangeAttributeChange[];
};

/** 让一个属性开始存在；派生属性只写入 0 占位，由 deriveCard 计算实际值。 */
export type AddAttributeEffect = {
	kind: typeof EffectType.ADD_ATTRIBUTE;
	attributeId: number;
};
