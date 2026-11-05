import type { AttributeDefinition } from "./attribute_types.ts";
import type { Condition } from "./condition_types.ts";
import type { EffectDefinition } from "./effect_types/effect_types.ts";
import type { RuleAction } from "./action_types.ts";
import type { CardTemplate } from "./template_types.ts";
import type { TagItem } from "./tag_types.ts";

/** 卡牌故事完整配置。famine 原型是当前实际使用的配置案例。 */
export interface GameConfig {
	/** 配置 schema 版本 */
	schemaVersion?: number;
	/** 全局标签定义 */
	allTags: TagItem[];
	/** 全局属性定义 */
	allAttributes: AttributeDefinition[];
	/** 动作定义 */
	allActions: RuleAction[];
	/** 可复用效果库 */
	allEffects?: EffectDefinition[];
	/** 卡牌模板 */
	cardTemplates: CardTemplate[];
	/** 初始存档；正式游戏启用后补齐具体结构 */
	saveData?: unknown;
	/** 初始日志 */
	initialLog?: string;
	/** 卡牌属性面板主展示的 derived 属性 id */
	primaryDerivedAttributeId?: number;
	/** 游戏结束条件 */
	gameOver?: Condition[];
	/** 时间推进日志配置 */
	tick?: unknown;
	[key: string]: unknown;
}
