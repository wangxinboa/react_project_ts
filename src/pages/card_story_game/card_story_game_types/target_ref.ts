/** 条件 / 效果可以指向的卡牌上下文。 */
export const TargetCardType = {
	/** 发起当前动作的卡牌（玩家或 NPC） */
	SOURCE_CARD: "sourceCard",
	/** 标签 auto 中的标签实例 */
	SOURCE_TAG: "sourceTag",
	/** incoming 动作中被响应的目标卡 */
	TARGET_CARD: "targetCard",
	/** 标签附着的宿主卡 */
	HOST: "host",
	/** 动作命名卡槽中的卡；slot 指定卡槽 id */
	SLOT: "slot",
	/** refListsMatch.condition 中当前遍历到的引用卡 */
	REFERENCED_CARD: "referencedCard",
	/** 当前动作中某个 addCard effect 创建出的卡 */
	CREATED_CARD: "createdCard",
} as const;

export type TargetCardType = (typeof TargetCardType)[keyof typeof TargetCardType];

/** 条件 / 效果的目标引用。 */
export interface TargetRef {
	card: TargetCardType;
	/** card 为 slot 时指定卡槽 */
	slot?: string;
	/** card 为 createdCard 时指定创建它的 addCard effect id */
	effectId?: number;
	/** 解析基础目标后，再读取该卡的这个 cardRef 属性指向的卡 */
	cardRefAttributeId?: number;
}
