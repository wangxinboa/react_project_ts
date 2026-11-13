import type { NumberExpression } from "./formula_types.ts";
import type { ConditionExpression } from "./condition_expression_types/condition_expression_types.ts";
import type { EffectCall } from "./effect_types/effect_types.ts";

/** 动作的命名卡槽。每个槽位独立放置，槽位之间不复用同一张卡。 */
export interface ActionSlot {
	id: string;
	desc: string;
	/** 精确数量；支持 NumberExpression，求值后 floor 且非负；与 min/max 互斥 */
	count?: NumberExpression;
	/** 动态数量下限；与 count 互斥，求值后 floor 且非负 */
	min?: NumberExpression;
	/** 动态数量上限；求值后 floor 且非负，max < min 视为无效 */
	max?: NumberExpression;
	condition?: ConditionExpression;
}

/** 动作定义；source 是发起者，incoming 的 target 是当前选中卡。 */
export interface RuleAction {
	id: number;
	verb: string;
	/** UI 标题 */
	title: string;
	/** 详细描述 */
	desc: string;
	createdAt: number;
	/** 时间计算公式；节点 condition 不满足时该节点为 0 */
	timeCost?: NumberExpression;
	/** 动作可用条件；普通动作用 sourceCard，incoming 可用 targetCard，数组内 AND */
	condition?: ConditionExpression;
	/** 命名目标槽 */
	slots?: ActionSlot[];
	/** 执行效果，按顺序应用 */
	effects?: EffectCall[];
	/** 旧 Editor 过渡字段；新规范使用 slots，不再使用 targets */
	targets?: unknown[];
}
