import type { Condition, TargetRef } from "./condition_types.ts";

/** 单个属性的增量或覆盖。 */
export interface ChangeAttributeChange {
	attributeId: number;
	delta?: number;
	set?: number;
	/** 单条属性修改的条件；不满足时跳过这条修改 */
	conditions?: Condition[];
}

/** 批量修改属性。 */
export type ChangeAttributesEffect = {
	kind: "changeAttributes";
	changes: ChangeAttributeChange[];
};

/** 给目标添加标签实例。 */
export type AddTagEffect = {
	kind: "addTag";
	tagId: number;
};

/** 从目标移除标签实例。 */
export type RemoveTagEffect = {
	kind: "removeTag";
	tagId: number;
};

/** 物品移动目标。 */
export type MoveItemDestination =
	| "sourceBackpack"
	| "sourceLocation"
	| "targetBackpack"
	| "targetLocation";

/** 在背包和地点之间移动物品。 */
export type MoveItemCardEffect = {
	kind: "moveItemCard";
	to: MoveItemDestination;
};

/** 切换目标卡牌模板。 */
export type ChangeTemplateEffect = {
	kind: "changeTemplate";
	templateId: number;
};

/** 在场景中生成一张新卡。 */
export type AddCardEffect = {
	kind: "addCard";
	templateId: number;
};

/** 从场景中移除目标卡。 */
export type RemoveCardEffect = {
	kind: "removeCard";
};

/** 改变卡牌所在地点。 */
export type ChangeLocationEffect = {
	kind: "changeLocation";
	toLocation: string;
};

/** 物品移动目标。第一版支持背包和当前地点。 */
export type EffectKind =
	| ChangeAttributesEffect
	| AddTagEffect
	| RemoveTagEffect
	| ChangeTemplateEffect
	| AddCardEffect
	| RemoveCardEffect
	| ChangeLocationEffect
	| MoveItemCardEffect;

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
	conditions?: Condition[];
};

/** 全局 allEffects 中的可复用效果。 */
export type EffectDefinition = InlineEffect;

/** 单次效果直接内联；多次复用时引用 allEffects 的 id。 */
export type EffectCall = { effectId: number } | InlineEffect;
