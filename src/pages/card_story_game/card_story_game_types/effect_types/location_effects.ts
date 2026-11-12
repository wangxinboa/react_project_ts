import type { EffectType } from "./effect_kind_types.ts";
/** 改变卡牌所在地点。 */
export type ChangeLocationEffect = {
	kind: typeof EffectType.CHANGE_LOCATION;
	toLocation: string;
};
