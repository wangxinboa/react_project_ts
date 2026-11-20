import type { CardType } from "../card_template_types/card_template_types.ts";
import type { TargetRef } from "../target_types/target_ref.ts";
import type { AttributeCheck } from "./attribute_check_types.ts";
import type { BaseNumberAttributeChangeCheck } from "./attribute_change_check_types.ts";
import type { DialogueCheck } from "./dialogue_check_types.ts";
import type { AgreementCheck } from "./agreement_check_types.ts";
import type { BaseNumberCheck } from "./base_number_check_types.ts";

/**
 * 条件判断对象。
 * 同一对象内的字段同时满足（AND）；多个 Condition 由外层数组组合。
 * Condition 只做单卡判定；双人判定由两个 Condition 组合。
 */
export interface Condition {
	/** 给编辑者看的条件说明，不参与运行时判断 */
	desc?: string;
	/** 世界时间判定，单位分钟 */
	worldTime?: BaseNumberCheck;
	/** 卡牌判定对象；纯 worldTime 条件可为空 */
	target?: TargetRef;
	/** 属性条件列表 */
	attributes?: AttributeCheck[];
	/** 反应上下文中的属性变化；只在 CardReactionDefinition 条件中有值 */
	attributeChanges?: BaseNumberAttributeChangeCheck[];
	/** target 指向的卡是否是 listOwner 指向卡的 refListId 列表成员 */
	memberOfRefList?: {
		listOwner: TargetRef;
		refListId: number;
	};
	/** 该卡的对话经历 */
	dialogues?: DialogueCheck[];
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
	/** 该卡模板必须与引用卡模板相同 */
	isSameTemplateAs?: TargetRef;
	/** 共识判定 */
	agreements?: AgreementCheck[];
}

export const ConditionGroupKind = {
	AND: "and",
	OR: "or",
} as const;

export type ConditionGroupKind = (typeof ConditionGroupKind)[keyof typeof ConditionGroupKind];

export const ConditionNotKind = {
	NOT: "not",
} as const;

export type ConditionNotKind = (typeof ConditionNotKind)[keyof typeof ConditionNotKind];

/** AND / OR 组合。子条件使用 items，避免与旧 conditions 字段混淆。 */
export interface ConditionGroup {
	kind: ConditionGroupKind;
	/** 给编辑者看的条件说明，不参与运行时判断 */
	desc?: string;
	items: ConditionExpression[];
}

/** 逻辑取反。 */
export interface ConditionNot {
	kind: ConditionNotKind;
	/** 给编辑者看的条件说明，不参与运行时判断 */
	desc?: string;
	item: ConditionExpression;
}

/** 条件表达式：叶子条件或逻辑组合。 */
export type ConditionExpression =
	| Condition
	| ConditionGroup
	| ConditionNot;
