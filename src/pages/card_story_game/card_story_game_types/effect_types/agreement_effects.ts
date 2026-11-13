import type { PromiseResult } from "../agreement_types.ts";
import type { TargetRef } from "../condition_types.ts";
import type { EffectType } from "./effect_kind_types.ts";

/** 创建一份双方已知、已接受的承诺共识。 */
export type CreateAgreementEffect = {
	kind: typeof EffectType.CREATE_AGREEMENT;
	definitionId: number;
	/** position key -> 参与者 */
	positions?: Record<string, TargetRef[]>;
};

/** 双方确认承诺结果；结果只由明确事件写入。 */
export type ConfirmPromiseEffect = {
	kind: typeof EffectType.CONFIRM_PROMISE;
	definitionId: number;
	promiseResult: PromiseResult;
};
