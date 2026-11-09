/** 创建一份双方已知、已接受的承诺共识。 */
export type CreateAgreementEffect = {
	kind: "createAgreement";
	definitionId: number;
};
