import type { ConditionExpression } from "../condition_expression_types/condition_expression_types.ts";
import type { EffectCall } from "../effect_types/effect_types.ts";

export const CardReactionTriggerKind = {
	ATTRIBUTE_CHANGED: "attributeChanged",
	TAG_ADDED: "tagAdded",
	TAG_REMOVED: "tagRemoved",
} as const;

export type CardReactionTrigger =
	| {
			kind: typeof CardReactionTriggerKind.ATTRIBUTE_CHANGED;
			attributeIds?: number[];
	  }
	| {
			kind: typeof CardReactionTriggerKind.TAG_ADDED;
			tagIds?: number[];
	  }
	| {
			kind: typeof CardReactionTriggerKind.TAG_REMOVED;
			tagIds?: number[];
	  };

/** 可复用的卡牌监听定义；模板通过 id 引用。 */
export interface CardReactionDefinition {
	id: number;
	key: string;
	desc?: string;
	trigger: CardReactionTrigger;
	condition?: ConditionExpression;
	effects: EffectCall[];
}
