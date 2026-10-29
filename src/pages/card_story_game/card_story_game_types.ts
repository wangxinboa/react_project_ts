// 卡牌故事配置；当前恢复标签 / 动作，其他字段先原样保留，后续页面逐步补类型。
export interface TagItem {
	id: number;
	key: string;
	desc: string;
	createdAt: number;
}

export const ActionParamType = {
	CARD: "card",
	NUMBER: "number",
} as const;

export type ActionParamType = (typeof ActionParamType)[keyof typeof ActionParamType];

export interface ActionParam {
	name: string;
	type: ActionParamType;
	default?: number;
}

export interface RuleAction {
	id: number;
	verb: string;
	desc: string;
	params: ActionParam[];
	targets: unknown[];
	conditions: unknown[];
	effects: unknown[];
	createdAt: number;
}

export interface GameConfig {
	allTags: TagItem[];
	allRules: RuleAction[];
	[key: string]: unknown;
}
