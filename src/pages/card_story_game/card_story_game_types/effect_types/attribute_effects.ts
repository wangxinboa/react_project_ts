import type { Condition } from "../condition_types.ts";
import type { NumberExpression } from "../formula_types.ts";

/** 单个属性的增量或覆盖。 */
export interface ChangeAttributeChange {
	attributeId: number;
	delta?: NumberExpression;
	set?: NumberExpression;
	/** 单条属性修改的条件；不满足时跳过这条修改 */
	conditions?: Condition[];
}

/** 批量修改属性。 */
export type ChangeAttributesEffect = {
	kind: "changeAttributes";
	changes: ChangeAttributeChange[];
};
