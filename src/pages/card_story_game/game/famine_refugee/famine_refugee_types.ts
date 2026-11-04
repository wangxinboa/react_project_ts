import type { AttributeValue } from "../../card_story_game_types/attribute_types.ts";
import type { Formula } from "../../card_story_game_types/formula_types.ts";
import type {
	ActionSlot,
	AttributeBinding,
	AttributeDefinition,
	CardTemplate,
	Condition,
	EffectCall,
	EffectDefinition,
	RuleAction,
	TagItem,
	TagKind,
} from "../../card_story_game_types/index.ts";

export type {
	ActionSlot,
	AttributeBinding,
	AttributeCheck,
	Condition,
	EffectCall,
	EffectDefinition,
	InlineEffect,
	TagAuto,
	TagKind,
} from "../../card_story_game_types/index.ts";

/** 原型属性定义：label 在 UI 中必须存在。 */
export type FamineAttributeDefinition = AttributeDefinition & {
	label: string;
};

/** 原型标签：derived / state 必须有明确 kind。 */
export type FamineTag = TagItem & {
	kind: TagKind;
};

/** state 标签实例。values 按 allAttributes 的 id 索引。 */
export interface TagInstanceState {
	tagId: number;
	values: Record<number, number>;
}

/** 原型动作：timeCost 和 slots 是实际运行必需字段。 */
export type FamineAction = RuleAction & {
	timeCost: Formula;
	slots: ActionSlot[];
	effects: EffectCall[];
};

export type TemplateAttributeBinding = AttributeBinding;

/** 原型模板。 */
export type FamineTemplate = CardTemplate;

export interface SaveCard {
	id: string;
	templateId: number;
	values?: Record<string, AttributeValue>;
}

export interface SaveData {
	playerCardId: string;
	time: number;
	cards: SaveCard[];
}

export interface FamineTick {
	logRules: Array<{ when?: Condition[]; message: string }>;
	defaultLog: string;
}

export interface FamineRefugeeConfig {
	schemaVersion: number;
	allTags: FamineTag[];
	allAttributes: FamineAttributeDefinition[];
	allEffects?: EffectDefinition[];
	allActions: FamineAction[];
	cardTemplates: FamineTemplate[];
	saveData: SaveData;
	initialLog: string;
	primaryDerivedAttributeId: number;
	gameOver: Condition[];
	tick: FamineTick;
}

export interface CardState {
	id: string;
	templateId: number;
	values: Record<number, AttributeValue>;
	tags: TagInstanceState[];
}

export interface FamineState {
	time: number;
	nextCardId: number;
	cards: CardState[];
	logs: string[];
}

export interface CardDerived {
	template: FamineTemplate;
	values: Record<number, number>;
	tagIds: number[];
	gameOver: boolean;
}
