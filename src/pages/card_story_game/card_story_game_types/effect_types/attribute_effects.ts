import type { ConditionExpression, RelationshipRef } from "../condition_types.ts";
import type { NumberExpression } from "../formula_types.ts";
import type { EffectType } from "./effect_kind_types.ts";

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
