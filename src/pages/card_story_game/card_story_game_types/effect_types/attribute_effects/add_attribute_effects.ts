import type { AttributeInit } from "../../attribute_types/attribute_init_types.ts";
import { EffectType } from "../effect_types.ts";

/** 新增缺失属性并初始化；已存在则跳过。 */
export type AddAttributeEffect = {
	kind: typeof EffectType.ADD_ATTRIBUTE;
	attributes: AttributeInit[];
};
