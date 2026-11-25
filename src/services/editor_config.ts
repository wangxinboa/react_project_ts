const DEFAULT_CONFIG_FILE = "card_story_game/card_story_game_default_config.json";

/** 开发环境加载编辑器默认配置；生产环境不使用。 */
export async function serviceLoadEditorDefaultConfig(): Promise<unknown> {
	const response = await fetch(`${import.meta.env.BASE_URL}${DEFAULT_CONFIG_FILE}`);

	if (!response.ok) {
		throw new Error(`编辑器默认配置加载失败：HTTP ${response.status}`);
	}

	return response.json();
}
