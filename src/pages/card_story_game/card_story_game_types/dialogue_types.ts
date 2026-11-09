import type { ConditionExpression, TargetRef } from "./condition_types.ts";
import type { EffectCall } from "./effect_types/effect_types.ts";

/** 对话入口：按顺序选择第一个满足条件的节点。 */
export interface DialogueEntry {
	nodeId: string;
	condition?: ConditionExpression;
}

/** 对话定义。 */
export interface DialogueDefinition {
	id: number;
	key: string;
	title: string;
	nodes: DialogueNode[];
	/** 按顺序选择第一个满足条件的入口；不写则使用 nodes[0] */
	entries?: DialogueEntry[];
}

/** 对话节点。 */
export interface DialogueNode {
	id: string;
	/** 当前节点说话者 */
	speaker: TargetRef;
	text: string;
	/** 无可见选项时，点击空白进入的下一节点；不写表示结束 */
	next?: string;
	options: DialogueOption[];
}

/** 对话选项。 */
export interface DialogueOption {
	id: string;
	text: string;
	condition?: ConditionExpression;
	effects?: EffectCall[];
	/** 下一个节点；不写表示结束对话 */
	next?: string;
}
