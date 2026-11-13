import type { PromiseConfirmation, PromiseResult, PromiseTimeRelation } from "../agreement_types.ts";
import type { TargetRef } from "./target_ref.ts";

/** 单卡上的共识判定。 */
export interface AgreementCheck {
	/** 共识定义 id；本身即表示要求存在该共识 */
	definitionId: number;

	/** 限定共识实例必须包含这些参与者 */
	includesTargets?: TargetRef[];

	/** 该卡在该共识中具备该位置 */
	hasPosition?: string;

	/** 该卡在该共识中同时具备这些位置，全部满足 */
	hasPositions?: string[];

	/** 是否已经过双方确认 */
	promiseConfirmation?: PromiseConfirmation;

	/** 截止时间关系 */
	promiseTime?: PromiseTimeRelation;

	/** 双方确认的结果 */
	promiseResult?: PromiseResult;
}
