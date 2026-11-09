import type { NumberExpression } from "../formula_types.ts";

export interface DialogueCountCheck {
	gt?: NumberExpression;
	gte?: NumberExpression;
	lt?: NumberExpression;
	lte?: NumberExpression;
	eq?: NumberExpression;
}

/** 单卡对话历史判定。 */
export interface DialogueCheck {
	dialogueId: number;
	triggered?: boolean;
	count?: DialogueCountCheck;
}
