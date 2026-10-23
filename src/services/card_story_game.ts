import type { TagItem, GameConfig } from "../pages/card_story_game/card_story_game_types.ts";

export async function serviceGetDefaultConfig(): Promise<TagItem[]> {
	const response = await fetch(`${import.meta.env.BASE_URL}card_story_game_default_config.json`);

	if (!response.ok) {
		throw new Error(`网络请求失败: ${response.status}`);
	}

	const data: GameConfig = await response.json();

	if (!data || !Array.isArray(data.allTags)) {
		throw new Error("配置文件格式不正确：allTags 必须是数组");
	}

	return data.allTags;
}
