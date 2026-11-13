import type { AttributeBinding } from "../attribute_types.ts";
import type { NumberExpression } from "../formula_types.ts";

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

/** NPC 自主行为配置；动作池复用 outgoing，按数组顺序尝试。 */
export interface NpcBehavior {
	/** 决策间隔（分钟）；支持 NumberExpression，求值后至少 1 分钟 */
	decisionInterval: NumberExpression;
}

/** 卡牌模板。模板只决定初始状态，运行时会生成独立 CardState。 */
export interface CardTemplate {
	id: number;
	key: string;
	cardType?: CardType;
	desc: string;
	/** 初始 state 标签 id 列表 */
	tags?: number[];
	/** 初始属性绑定 */
	attributes?: AttributeBinding[];
	/** 每小时执行的 auto 动作 id */
	auto?: number[];
	/** 主动动作 id；由 sourceCard 发起，目标通过 slots 放置；NPC 行为按此数组顺序尝试 */
	outgoing?: number[];
	/** 响应动作 id；source 为执行者，target 为当前卡，一对一 */
	incoming?: number[];
	/** NPC 自主行为；没有该字段则不自动行动 */
	behavior?: NpcBehavior;
	/** 卡牌级监听定义 id；数组顺序即优先级 */
	reactions?: number[];
	createdAt: number;
}
