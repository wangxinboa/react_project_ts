import type { EffectType } from "./effect_kind_types.ts";
/** 开始一段对话。 */
export type StartDialogueEffect = {
	kind: typeof EffectType.START_DIALOGUE;
	dialogueId: number;
};
