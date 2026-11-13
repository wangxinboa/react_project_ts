/** 卡牌类型。只描述卡牌的结构角色，不直接决定行为。 */
export const CardType = {
	/** 生灵：人、兽、灵体、NPC、玩家 */
	BEING: "being",
	/** 物品、食物、工具 */
	ITEM: "item",
	/** 地点 */
	PLACE: "place",
	/** 通往其他地点的通道：小路、门、传送点等 */
	PASSAGE: "passage",
} as const;

export type CardType = (typeof CardType)[keyof typeof CardType];
