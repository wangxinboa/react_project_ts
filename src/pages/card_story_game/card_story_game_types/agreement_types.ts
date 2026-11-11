import type { NumberExpression } from "./formula_types.ts";

/** 共识大类。第一版只有承诺。 */
export const AgreementKind = {
	PROMISE: "promise",
} as const;

export type AgreementKind = (typeof AgreementKind)[keyof typeof AgreementKind];

/** 双方是否已经确认结果。 */
export const AgreementConfirmation = {
	CONFIRMED: "confirmed",
	UNCONFIRMED: "unconfirmed",
} as const;

export type AgreementConfirmation = (typeof AgreementConfirmation)[keyof typeof AgreementConfirmation];

/** 截止时间关系。 */
export const AgreementTimeRelation = {
	OVERDUE: "overdue",
	NOT_OVERDUE: "notOverdue",
} as const;

export type AgreementTimeRelation = (typeof AgreementTimeRelation)[keyof typeof AgreementTimeRelation];

/** 双方确认的承诺结果。 */
export const AgreementResult = {
	KEPT: "kept",
	BROKEN: "broken",
} as const;

export type AgreementResult = (typeof AgreementResult)[keyof typeof AgreementResult];

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
	/** 等待时长，单位分钟；创建时求值 */
	waitTime?: NumberExpression;
	/** 共识中的位置 */
	positions?: AgreementPositionDefinition[];
}
