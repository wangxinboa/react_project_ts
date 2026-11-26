import type { AttributeDefinition } from "./attribute_types/attribute_types.ts";
import type { Condition } from "./condition_expression_types/condition_expression_types.ts";
import type { EffectDefinition } from "./effect_types/effect_types.ts";
import type { RuleAction } from "./action_types.ts";
import type { CardTemplate } from "./card_template_types/card_template_types.ts";
import type { CardReactionDefinition } from "./card_template_types/card_reaction_types.ts";
import type { DialogueDefinition } from "./dialogue_types.ts";
import type { AgreementDefinition } from "./agreement_types.ts";
import type { TagItem } from "./tag_types.ts";

/** 卡牌故事编辑器配置；只包含可编辑、可序列化的定义数据。 */
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
	/** 卡牌监听定义 */
	allCardReactions?: CardReactionDefinition[];
	/** 卡牌模板 */
	cardTemplates: CardTemplate[];
	/** 对话定义 */
	allDialogues?: DialogueDefinition[];
	/** 共识定义 */
	allAgreements?: AgreementDefinition[];
}


/** 游戏运行期配置；不属于编辑器维护的静态配置。 */
export interface GameRuntimeConfig {
	/** 初始存档 */
	saveData?: unknown;
	/** 初始日志 */
	initialLog?: string;
	/** 卡牌属性面板主展示的 derived 属性 id */
	primaryDerivedAttributeId?: number;
	/** 游戏结束条件 */
	gameOver?: Condition[];
	/** 时间推进日志配置 */
	tick?: unknown;
}
