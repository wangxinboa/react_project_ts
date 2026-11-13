import type { NumberExpression } from "./formula_types.ts";

/** 共识大类。第一版只有承诺。 */
export const AgreementKind = {
	PROMISE: "promise",
} as const;

export type AgreementKind = (typeof AgreementKind)[keyof typeof AgreementKind];

/** 双方是否已经确认承诺结果。 */
export const PromiseConfirmation = {
	CONFIRMED: "confirmed",
	UNCONFIRMED: "unconfirmed",
} as const;

export type PromiseConfirmation = (typeof PromiseConfirmation)[keyof typeof PromiseConfirmation];

/** 承诺的截止时间关系。 */
export const PromiseTimeRelation = {
	OVERDUE: "overdue",
	NOT_OVERDUE: "notOverdue",
} as const;

export type PromiseTimeRelation = (typeof PromiseTimeRelation)[keyof typeof PromiseTimeRelation];

/** 双方确认的承诺结果。 */
export const PromiseResult = {
	KEPT: "kept",
	BROKEN: "broken",
} as const;

export type PromiseResult = (typeof PromiseResult)[keyof typeof PromiseResult];

/** 共识中的位置定义。 */
export interface AgreementPositionDefinition {
	key: string;
	label: string;
}

/** 共识定义：只描述共识内容，不绑定参与卡。 */
export interface AgreementDefinition {
	id: number;
	key: string;
	kind: AgreementKind;
	title: string;
	desc: string;
	/** 共识中的位置 */
	positions?: AgreementPositionDefinition[];
	/** 承诺等待时长，单位分钟；创建时求值 */
	promiseWaitTime?: NumberExpression;
}
