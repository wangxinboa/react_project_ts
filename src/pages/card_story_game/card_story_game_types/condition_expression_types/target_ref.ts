/** Condition / Effect 指向的卡牌或上下文对象。 */
export const ConditionTarget = {
	/** 发起当前动作的卡牌（玩家或 NPC） */
	SOURCE_CARD: "sourceCard",
	/** 标签 auto 中的标签实例 */
	SOURCE_TAG: "sourceTag",
	/** incoming 动作中被响应的目标卡 */
	TARGET_CARD: "targetCard",
	/** 标签附着的宿主卡 */
	HOST: "host",
	/** 动作命名卡槽中的卡；TargetRef.slot 指定卡槽 id */
	SLOT: "slot",
	/** refListsMatch.match 中当前遍历到的引用卡 */
	REFERENCED_CARD: "referencedCard",
} as const;

export type ConditionTarget = (typeof ConditionTarget)[keyof typeof ConditionTarget];

/** Condition / Effect 的目标引用。 */
export interface TargetRef {
	card: ConditionTarget;
	/** card 为 slot 时指定卡槽 */
	slot?: string;
}
