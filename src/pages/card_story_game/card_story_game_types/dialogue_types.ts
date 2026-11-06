import type { Condition, TargetRef } from "./condition_types.ts";
import type { EffectCall } from "./effect_types/effect_types.ts";

/** 对话定义。 */
export interface DialogueDefinition {
	id: number;
	key: string;
	title: string;
	nodes: DialogueNode[];
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
	conditions?: Condition[];
	effects?: EffectCall[];
	/** 下一个节点；不写表示结束对话 */
	next?: string;
}
