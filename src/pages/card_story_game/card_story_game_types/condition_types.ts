/**
 * 卡牌类型。
 * 只描述卡牌的结构角色，不直接决定行为。
 */
export const CardType = {
	/** 人物、NPC、玩家 */
	PERSON: "person",
	/** 物品、食物、工具 */
	ITEM: "item",
	/** 地点 */
	PLACE: "place",
	/** 通往其他地点的通道：小路、门、传送点等 */
	PASSAGE: "passage",
} as const;

export type CardType = (typeof CardType)[keyof typeof CardType];

/**
 * 单个属性的比较条件。
 * 属性条件以数组形式组合，数组内默认全部满足（AND）。
 */
export type AttributeCheck = {
	/** number 属性 id */
	id?: number;
	/** cardRef 属性 id */
	refId?: number;
	/** cardRefList 属性 id */
	refListId?: number;
	/** 大于 */
	gt?: number;
	/** 大于等于 */
	gte?: number;
	/** 小于 */
	lt?: number;
	/** 小于等于 */
	lte?: number;
	/** 等于 */
	eq?: number;
	/** cardRef 是否存在 */
	refExists?: boolean;
	/** cardRefList 引用卡匹配 */
	refListsMatch?: {
		match?: Condition[];
		min?: number;
		max?: number;
		count?: number;
	};
};

/**
 * 条件判断对象。
 * 同一对象内的字段同时满足（AND）；多个 Condition 由外层数组组合。
 */
export interface Condition {
	/** 判断对象 */
	target: TargetRef;
	/** 给编辑者看的条件说明，不参与运行时判断 */
	desc?: string;
	/** 属性条件列表 */
	attributes?: AttributeCheck[];
	/** 必须拥有该标签 */
	hasTag?: number;
	/** 必须同时拥有这些标签 */
	hasTags?: number[];
	/** 至少拥有其中一个标签 */
	hasAnyTag?: number[];
	/** 标签集合必须完全等于该单标签 */
	onlyHasTag?: number;
	/** 标签集合必须完全等于该标签集合 */
	onlyHasTags?: number[];
	/** 模板必须等于该 id */
	hasTemplate?: number;
	/** 模板必须属于该 id 集合 */
	hasAnyTemplate?: number[];
	/** 模板必须完全等于该 id；与 hasTemplate 等价，保留给严格语义 */
	onlyHasTemplate?: number;
	/** 卡牌类型必须等于该类型 */
	hasCardType?: CardType;
	/** 卡牌类型必须属于该集合 */
	hasAnyCardType?: CardType[];
}

/**
 * 条件/效果的作用对象。
 *
 * - sourceCard：发起当前动作的卡牌（玩家或 NPC）
 * - sourceTag：标签 auto 中的标签实例
 * - targetCard：incoming 动作中被响应的目标卡
 * - host：标签附着的宿主卡
 * - slot：动作命名卡槽中的卡
 */
export const ConditionTarget = {
	SOURCE_CARD: "sourceCard",
	SOURCE_TAG: "sourceTag",
	TARGET_CARD: "targetCard",
	HOST: "host",
	SLOT: "slot",
	REFERENCED_CARD: "referencedCard",
} as const;

export type ConditionTarget = (typeof ConditionTarget)[keyof typeof ConditionTarget];

/** 条件判断目标。 */
export interface TargetRef {
	card: ConditionTarget;
	/** card 为 slot 时指定卡槽 */
	slot?: string;
}

