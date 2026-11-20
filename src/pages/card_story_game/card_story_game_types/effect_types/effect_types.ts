export const EffectType = {
	CHANGE_ATTRIBUTES: "changeAttributes",
	ADD_ATTRIBUTE: "addAttribute",
	ADD_TAG: "addTag",
	REMOVE_TAG: "removeTag",
	CHANGE_TEMPLATE: "changeTemplate",
	ADD_CARD: "addCard",
	REMOVE_CARD: "removeCard",
	START_DIALOGUE: "startDialogue",
	CREATE_AGREEMENT: "createAgreement",
	CONFIRM_PROMISE: "confirmPromise",
} as const;

export type EffectType = (typeof EffectType)[keyof typeof EffectType];

import type { ConditionExpression } from "../condition_expression_types/condition_expression_types.ts";
import type { TargetRef } from "../target_ref.ts";
import type { AddAttributeEffect } from "./attribute_effects/add_attribute_effects.ts";
import type { ChangeCardAttributesEffect } from "./attribute_effects/change_attribute_effects.ts";
import type { CreateAgreementEffect, ConfirmPromiseEffect } from "./agreement_effects.ts";
import type { AddTagEffect, RemoveTagEffect } from "./tag_effects.ts";
import type { ChangeTemplateEffect } from "./template_effects.ts";
import type { AddCardEffect, RemoveCardEffect } from "./card_effects.ts";
import type { StartDialogueEffect } from "./dialogue_effects.ts";


/** 所有效果类型。 */
export type EffectKind =
	| ChangeCardAttributesEffect
	| AddAttributeEffect
	| AddTagEffect
	| RemoveTagEffect
	| ChangeTemplateEffect
	| AddCardEffect
	| RemoveCardEffect
	| StartDialogueEffect
	| CreateAgreementEffect
	| ConfirmPromiseEffect
;

/** Effect 作用对象；与 Condition target 使用同一套 TargetRef。 */
export type EffectTarget = TargetRef;

/**
 * 直接写在动作 / 标签 auto 中的单次效果。
 * id 仅用于保留稳定身份；以后需要被多处引用时，移动到 allEffects，id 不变。
 */
export type InlineEffect = EffectKind & {
	id: number;
	/** 给编辑者看的效果说明，不参与运行时执行 */
	desc?: string;
	/** 作用对象；普通动作缺省 sourceCard，tag auto 缺省 sourceTag */
	target?: EffectTarget;
	/** 效果自身条件，数组内 AND */
	condition?: ConditionExpression;
};

/** 全局 allEffects 中的可复用效果。 */
export type EffectDefinition = InlineEffect;

/** 单次效果直接内联；多次复用时引用 allEffects 的 id。 */
export type EffectCall = { effectId: number } | InlineEffect;
