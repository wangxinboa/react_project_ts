import type { AgreementResult } from "../agreement_types.ts";

/** 创建一份双方已知、已接受的承诺共识。 */
export type CreateAgreementEffect = {
	kind: "createAgreement";
	definitionId: number;
};

/** 双方确认承诺结果；结果只由明确事件写入。 */
export type ResolveAgreementEffect = {
	kind: "resolveAgreement";
	definitionId: number;
	result: AgreementResult;
};
