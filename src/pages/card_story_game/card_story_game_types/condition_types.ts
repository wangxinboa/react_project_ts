/**
 * 单个属性的比较条件。
 * 属性条件以数组形式组合，数组内默认全部满足（AND）。
 */
export type AttributeCheck = {
	id: number;
	gt?: number;
	gte?: number;
	lt?: number;
	lte?: number;
	eq?: number;
};

/**
 * 条件判断对象。
 *
 * target 决定判断谁：
 * - source：当前执行动作的实体（卡牌 / 标签实例）；
 * - host：标签附着的宿主卡；
 * - slot：动作命名卡槽中的目标卡。
 *
 * 同一对象内的字段同时满足（AND）。
 */
export interface Condition {
	target: "source" | "host" | "slot";
	/** 属性条件列表 */
	attributes?: AttributeCheck[];
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
	hasTemplate?: number;
	/** 模板必须属于该 id 集合 */
	hasAnyTemplate?: number[];
	/** 模板必须完全等于该 id（与 hasTemplate 类似，保留给严格判断） */
	onlyHasTemplate?: number;
	/** 当 target 为 slot 时，指定要判断哪个命名卡槽 */
	slot?: string;
}
