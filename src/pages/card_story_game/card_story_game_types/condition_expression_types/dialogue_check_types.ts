import type { TargetRef } from "./target_ref.ts";
import type { BaseNumberCheck } from "./base_number_check_types.ts";

export type DialogueCountCheck = BaseNumberCheck;

/** 单卡对话历史判定。 */
export interface DialogueCheck {
	dialogueId: number;
	/** 只统计与指定对象的共同经历 */
	includesTargets?: TargetRef[];
	triggered?: boolean;
	count?: DialogueCountCheck;

	/** 经历过该节点 */
	experiencedNodeId?: string;
	/** 经历过这些节点，全部满足 */
	experiencedNodeIds?: string[];

	/** 选择过该选项 */
	chosenOptionId?: string;
	/** 选择过这些选项，全部满足 */
	chosenOptionIds?: string[];

	/** 对话在哪个节点结束 */
	endedAtNodeId?: string;
}
