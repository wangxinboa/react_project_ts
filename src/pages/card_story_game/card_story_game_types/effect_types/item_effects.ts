import type { EffectType } from "./effect_kind_types.ts";
/** 物品移动目标。source/target 对应动作执行者与 incoming 目标。 */
export const MoveItemDestination = {
	SOURCE_BACKPACK: "sourceBackpack",
	SOURCE_LOCATION: "sourceLocation",
	TARGET_BACKPACK: "targetBackpack",
	TARGET_LOCATION: "targetLocation",
} as const;

export type MoveItemDestination = (typeof MoveItemDestination)[keyof typeof MoveItemDestination];

/** 在背包和地点之间移动物品。 */
export type MoveItemCardEffect = {
	kind: typeof EffectType.MOVE_ITEM_CARD;
	to: MoveItemDestination;
};
