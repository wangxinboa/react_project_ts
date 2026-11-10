import type { CardType } from "./card_type.ts";
import type { TargetRef } from "./target_ref.ts";
import type { AttributeCheck } from "./attribute_check_types.ts";
import type { DialogueCheck } from "./dialogue_check_types.ts";
import type { AgreementCheck } from "./agreement_check_types.ts";

/**
 * 条件判断对象。
 * 同一对象内的字段同时满足（AND）；多个 Condition 由外层数组组合。
 * Condition 只做单卡判定；双人判定由两个 Condition 组合。
 */
export interface Condition {
	/** 判断对象 */
	target: TargetRef;
	/** 给编辑者看的条件说明，不参与运行时判断 */
	desc?: string;
	/** 属性条件列表 */
	attributes?: AttributeCheck[];
	/** 该卡的对话经历 */
	dialogue?: DialogueCheck;
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
	isTemplate?: number;
	/** 模板必须属于该 id 集合 */
	isAnyTemplate?: number[];
	/** 卡牌类型必须等于该类型 */
	isCardType?: CardType;
	/** 卡牌类型必须属于该集合 */
	isAnyCardType?: CardType[];
	/** 共识判定 */
	agreement?: AgreementCheck;
}
