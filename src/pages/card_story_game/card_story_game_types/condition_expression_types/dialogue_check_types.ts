import type { NumberExpression } from "../formula_types.ts";
import type { TargetRef } from "./target_ref.ts";

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
	/** 只统计与指定对象的共同经历 */
	includesTargets?: TargetRef[];
	triggered?: boolean;
	count?: DialogueCountCheck;
}
