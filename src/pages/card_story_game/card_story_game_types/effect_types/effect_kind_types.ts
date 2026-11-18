/** 所有 effect 的 kind。 */
export const EffectType = {
	CHANGE_BASE_NUMBER_ATTRIBUTES: "changeBaseNumberAttributes",
	ADD_CARD_ATTRIBUTE: "addCardAttribute",
	LEARN_SKILL: "learnSkill",
	CHANGE_RELATIONSHIP_NUMBER_ATTRIBUTES: "changeRelationshipNumberAttributes",
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
