/** 所有 effect 的 kind。 */
export const EffectType = {
	CHANGE_ATTRIBUTES: "changeAttributes",
	CHANGE_RELATIONSHIP_ATTRIBUTES: "changeRelationshipAttributes",
	ADD_TAG: "addTag",
	REMOVE_TAG: "removeTag",
	CHANGE_TEMPLATE: "changeTemplate",
	ADD_CARD: "addCard",
	REMOVE_CARD: "removeCard",
	CHANGE_LOCATION: "changeLocation",
	MOVE_ITEM_CARD: "moveItemCard",
	START_DIALOGUE: "startDialogue",
	CREATE_AGREEMENT: "createAgreement",
	CONFIRM_PROMISE: "confirmPromise",
} as const;

export type EffectType = (typeof EffectType)[keyof typeof EffectType];
