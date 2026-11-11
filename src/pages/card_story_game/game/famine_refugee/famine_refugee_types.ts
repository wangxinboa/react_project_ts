import type { AttributeValue } from "../../card_story_game_types/attribute_types.ts";
import type { AgreementResult } from "../../card_story_game_types/agreement_types.ts";
import type { NumberExpression } from "../../card_story_game_types/formula_types.ts";
import type {
	ActionSlot,
	AttributeBinding,
	AttributeDefinition,
	CardTemplate,
	Condition,
	EffectCall,
	AgreementDefinition,
	DialogueDefinition,
	EffectDefinition,
	RuleAction,
	TagItem,
	TagKind,
} from "../../card_story_game_types/index.ts";

export type {
	ActionSlot,
	DialogueNode,
	DialogueOption,
	AttributeBinding,
	AttributeCheck,
	Condition,
	ConditionExpression,
	ConditionGroup,
	ConditionNot,
	EffectCall,
	AgreementDefinition,
	DialogueDefinition,
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
	timeCost: NumberExpression;
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
	allDialogues: DialogueDefinition[];
	allAgreements: AgreementDefinition[];
	allActions: FamineAction[];
	cardTemplates: FamineTemplate[];
	saveData: SaveData;
	initialLog: string;
	primaryDerivedAttributeId: number;
	gameOver: Condition[];
	tick: FamineTick;
}

export interface RelationshipState {
	values: Record<number, number>;
}

export interface CardState {
	id: string;
	templateId: number;
	values: Record<number, AttributeValue>;
	nextBehaviorTime?: number;
	/** targetCardId -> 关系属性值 */
	relationships?: Record<string, RelationshipState>;
	/** 已知/参与的共识 id */
	agreementIds?: string[];
	tags: TagInstanceState[];
}

export interface DialogueHistoryEntry {
	dialogueId: number;
	initiatorId: string;
	participantIds: string[];
	count: number;
	visitedNodeIds: string[];
	chosenOptionIds: string[];
	endedAtNodeId?: string;
}

export interface AgreementResolution {
	result: AgreementResult;
	at: number;
	confirmedBy: string[];
}

export interface AgreementState {
	id: string;
	definitionId: number;
	participants: string[];
	proposerId: string;
	knownBy: string[];
	acceptedBy: string[];
	positions: Record<string, string[]>;
	createdAt: number;
	deadline?: number;
	resolution?: AgreementResolution;
}

export interface DialogueState {
	dialogueId: number;
	nodeId: string;
	sourceCardId: string;
	targetCardId?: string;
	slotMap: Record<string, string[]>;
}

export interface FamineState {
	time: number;
	nextCardId: number;
	nextAgreementId: number;
	cards: CardState[];
	logs: string[];
	agreements: Record<string, AgreementState>;
	dialogueHistory: DialogueHistoryEntry[];
	dialogue?: DialogueState;
}

export interface CardDerived {
	template: FamineTemplate;
	values: Record<number, number>;
	tagIds: number[];
	gameOver: boolean;
}
