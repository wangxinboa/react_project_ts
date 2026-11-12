import type { EffectType } from "./effect_kind_types.ts";
/** sourceBackpack：进入执行者背包；sourceLocation：生成在执行者当前地点。 */
export const AddCardDestination = {
	SOURCE_BACKPACK: "sourceBackpack",
	SOURCE_LOCATION: "sourceLocation",
} as const;

export type AddCardDestination = (typeof AddCardDestination)[keyof typeof AddCardDestination];
/** 生成一张新卡；默认进入执行者背包。 */
export type AddCardEffect = {
	kind: typeof EffectType.ADD_CARD;
	templateId: number;
	to?: AddCardDestination;
};

/** 从场景中移除目标卡。 */
export type RemoveCardEffect = {
	kind: typeof EffectType.REMOVE_CARD;
};
