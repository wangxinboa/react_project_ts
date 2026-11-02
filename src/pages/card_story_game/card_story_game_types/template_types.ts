import type { AttributeBinding } from "./attribute_types.ts";

/** 卡牌模板。模板只决定初始状态，运行时会生成独立 CardState。 */
export interface CardTemplate {
	id: number;
	key: string;
	desc: string;
	/** 初始 state 标签 id 列表 */
	tags?: number[];
	/** 初始属性绑定 */
	attributes?: AttributeBinding[];
	/** 每小时执行的 auto 动作 id */
	auto?: number[];
	/** 主动动作 id；当前 UI 只有玩家作为 source */
	outgoing?: number[];
	createdAt: number;
	/** 过渡字段：Editor 模板页迁移后删除 */
	incoming?: number[];
}
