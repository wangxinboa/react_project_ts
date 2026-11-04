import type { AttributeBinding } from "./attribute_types.ts";
import type { CardType } from "./condition_types.ts";

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
	/** 主动动作 id；由 sourceCard 发起，目标通过 slots 放置 */
	outgoing?: number[];
	/** 响应动作 id；source 为执行者，target 为当前卡，一对一 */
	incoming?: number[];
	createdAt: number;
}
