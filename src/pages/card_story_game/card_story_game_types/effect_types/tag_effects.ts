import type { EffectType } from "./effect_kind_types.ts";
/** 给目标添加标签实例。 */
export type AddTagEffect = {
	kind: typeof EffectType.ADD_TAG;
	tagId: number;
};

/** 从目标移除标签实例。 */
export type RemoveTagEffect = {
	kind: typeof EffectType.REMOVE_TAG;
	tagId: number;
};
