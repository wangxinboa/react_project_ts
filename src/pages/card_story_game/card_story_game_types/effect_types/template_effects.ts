import type { EffectType } from "./effect_kind_types.ts";
/** 切换目标卡牌模板。 */
export type ChangeTemplateEffect = {
	kind: typeof EffectType.CHANGE_TEMPLATE;
	templateId: number;
};
