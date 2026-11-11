/** 物品移动目标。source/target 对应动作执行者与 incoming 目标。 */
export type MoveItemDestination = "sourceBackpack" | "sourceLocation" | "targetBackpack" | "targetLocation";

/** 在背包和地点之间移动物品。 */
export type MoveItemCardEffect = {
	kind: "moveItemCard";
	to: MoveItemDestination;
};
