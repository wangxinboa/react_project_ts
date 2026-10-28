import type { GameConfig, TagItem } from "../pages/card_story_game/card_story_game_types.ts";

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
	const allTags = (raw as { allTags: unknown[] }).allTags.map((item) => {
		const tag = item as TagItem & { createdAt?: unknown };
		return {
			...tag,
			createdAt: typeof tag.createdAt === "number" ? tag.createdAt : now,
		};
	});

	return { ...raw, allTags };
}
