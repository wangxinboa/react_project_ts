import type { GameConfig, RuleAction, TagItem } from "../pages/card_story_game/card_story_game_types.ts";

const CONFIG_FILE = "card_story_game_default_config.json";

export async function serviceGetCardStoryGameConfig(): Promise<GameConfig> {
	const response = await fetch(`${import.meta.env.BASE_URL}${CONFIG_FILE}`);
	if (!response.ok) {
		throw new Error(`配置加载失败：HTTP ${response.status}`);
	}

	const raw: unknown = await response.json();
	if (typeof raw !== "object" || raw === null || !Array.isArray((raw as { allTags?: unknown }).allTags)) {
		throw new Error("配置格式错误：allTags 必须是数组");
	}

	const now = Date.now();
	const rawTags = (raw as { allTags: unknown[] }).allTags;
	const allTags: TagItem[] = [];
	for (let i = 0; i < rawTags.length; i++) {
		const tag = rawTags[i] as TagItem & { createdAt?: unknown };
		allTags.push({
			...tag,
			createdAt: typeof tag.createdAt === "number" ? tag.createdAt : now,
		});
	}

	const rawRules = (raw as { allRules?: unknown }).allRules;
	const allRules: RuleAction[] = [];
	if (Array.isArray(rawRules)) {
		for (let i = 0; i < rawRules.length; i++) {
			const action = rawRules[i] as RuleAction & { createdAt?: unknown };
			allRules.push({
				...action,
				desc: typeof action.desc === "string" ? action.desc : "",
				createdAt: typeof action.createdAt === "number" ? action.createdAt : now,
				params: Array.isArray(action.params) ? action.params : [],
				targets: Array.isArray(action.targets) ? action.targets : [],
				conditions: Array.isArray(action.conditions) ? action.conditions : [],
				effects: Array.isArray(action.effects) ? action.effects : [],
			});
		}
	}

	return { ...raw, allTags, allRules };
}
