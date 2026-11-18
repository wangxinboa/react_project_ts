import type { ConditionExpression } from "../condition_expression_types/condition_expression_types.ts";
import type { RelationshipRef } from "../condition_expression_types/attribute_check_types.ts";
import type { NumberExpression } from "../formula_types.ts";
import { EffectType } from "./effect_kind_types.ts";

/** 单个基础数值属性的增量或覆盖。 */
export interface ChangeBaseNumberAttributeChange {
	attributeId: number;
	delta?: NumberExpression;
	set?: NumberExpression;
	/** 单条属性修改的条件；不满足时跳过这条修改 */
	condition?: ConditionExpression;
}

/** 批量修改卡牌基础数值属性。 */
export type ChangeBaseNumberAttributesEffect = {
	kind: typeof EffectType.CHANGE_BASE_NUMBER_ATTRIBUTES;
	changes: ChangeBaseNumberAttributeChange[];
};

/** 修改 sourceCard → targetCard 的关系数值属性。 */
export type ChangeRelationshipNumberAttributesEffect = {
	kind: typeof EffectType.CHANGE_RELATIONSHIP_NUMBER_ATTRIBUTES;
	relationship: RelationshipRef;
	changes: ChangeBaseNumberAttributeChange[];
};

/** 让一个卡牌属性开始存在；派生属性只写入 0 占位，由 deriveCard 计算实际值。 */
export type AddCardAttributeEffect = {
	kind: typeof EffectType.ADD_CARD_ATTRIBUTE;
	attributeId: number;
};
