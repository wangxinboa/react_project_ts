import type { EffectType } from "./effect_kind_types.ts";

/** 从指定动作卡槽中的技能卡复制一份新技能给 sourceCard。 */
export type LearnSkillEffect = {
	kind: typeof EffectType.LEARN_SKILL;
	/** 动作卡槽 id；其中放入目标技能卡 */
	skillSlot: string;
};
