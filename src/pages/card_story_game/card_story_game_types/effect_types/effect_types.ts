import type { ConditionExpression, TargetRef } from "../condition_types.ts";
import type { ChangeAttributesEffect, ChangeRelationshipAttributesEffect } from "./attribute_effects.ts";
import type { CreateAgreementEffect } from "./agreement_effects.ts";
export type { CreateAgreementEffect } from "./agreement_effects.ts";
import type { AddTagEffect, RemoveTagEffect } from "./tag_effects.ts";
import type { ChangeTemplateEffect } from "./template_effects.ts";
import type { AddCardEffect, RemoveCardEffect } from "./card_effects.ts";
import type { ChangeLocationEffect } from "./location_effects.ts";
import type { MoveItemCardEffect } from "./item_effects.ts";
import type { StartDialogueEffect } from "./dialogue_effects.ts";

export type {
	ChangeAttributeChange,
	ChangeAttributesEffect,
	ChangeRelationshipAttributesEffect,
} from "./attribute_effects.ts";
export type { AddTagEffect, RemoveTagEffect } from "./tag_effects.ts";
export type { ChangeTemplateEffect } from "./template_effects.ts";
export type { AddCardDestination, AddCardEffect, RemoveCardEffect } from "./card_effects.ts";
export type { ChangeLocationEffect } from "./location_effects.ts";
export type { MoveItemCardEffect, MoveItemDestination } from "./item_effects.ts";
export type { StartDialogueEffect } from "./dialogue_effects.ts";

/** 所有效果类型。 */
export type EffectKind =
	| ChangeAttributesEffect
	| AddTagEffect
	| RemoveTagEffect
	| ChangeTemplateEffect
	| AddCardEffect
	| RemoveCardEffect
	| ChangeLocationEffect
	| MoveItemCardEffect
	| StartDialogueEffect
	| ChangeRelationshipAttributesEffect
	| CreateAgreementEffect;

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
