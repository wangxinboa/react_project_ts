import type { AttributeInit } from "../attribute_types/attribute_init_types.ts";
import type { TargetRef } from "../target_types/target_ref.ts";
import type { EffectType } from "./effect_types.ts";

/** 生成一张新卡；默认进入执行者背包。 */
export type AddCardEffect = {
	kind: typeof EffectType.ADD_CARD;
	templateId?: number;
	/** 从目标卡实例读取模板 id；与 templateId 二选一 */
	templateFrom?: TargetRef;
	/** 覆盖新卡的初始属性 */
	attributes?: AttributeInit[];
};

/** 从场景中移除目标卡。 */
export type RemoveCardEffect = {
	kind: typeof EffectType.REMOVE_CARD;
};
