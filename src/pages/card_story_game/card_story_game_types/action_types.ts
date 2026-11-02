import type { Formula } from "../formula/formula_types.ts";
import type { Condition } from "./condition_types.ts";
import type { EffectCall } from "./effect_types.ts";

/** 动作的命名卡槽。每个槽位独立放置，槽位之间不复用同一张卡。 */
export interface ActionSlot {
	id: string;
	desc: string;
	/** 精确数量；与 min/max 互斥 */
	count?: number;
	min?: number;
	max?: number;
	/** 槽内卡牌必须满足的条件；target 通常为 slot */
	conditions: Condition[];
}

export const ActionParamType = {
	CARD: "card",
	NUMBER: "number",
} as const;

export type ActionParamType = (typeof ActionParamType)[keyof typeof ActionParamType];

/** 动作参数声明；与公式 param 无关。 */
export interface ActionParam {
	name: string;
	type: ActionParamType;
	default?: number;
}

/** 动作定义；所有动作都始于某张 source 卡牌。 */
export interface RuleAction {
	id: number;
	verb: string;
	desc: string;
	params: ActionParam[];
	createdAt: number;
	/** 时间计算公式；节点 conditions 不满足时该节点为 0 */
	timeCost?: Formula;
	/** source 可用条件，数组内 AND */
	conditions: Condition[];
	/** 命名目标槽 */
	slots?: ActionSlot[];
	/** 执行效果，按顺序应用 */
	effects: EffectCall[];
	/** 过渡字段：Editor 表单迁移到 slots 后删除 */
	targets?: unknown[];
}
