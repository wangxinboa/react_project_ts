/** 共识大类。第一版只有承诺。 */
export type AgreementKind = "promise";

/** 共识定义：只描述共识内容，不绑定参与卡。 */
export interface AgreementDefinition {
	id: number;
	key: string;
	kind: AgreementKind;
	title: string;
	desc: string;
}
