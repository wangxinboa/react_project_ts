import type { GameConfig } from "../pages/card_story_game/card_story_game_types/index.ts";

const DEFAULT_CONFIG_FILE = "card_story_game/card_story_game_default_config.json";

function normalizeEditorConfig(raw: unknown): GameConfig {
	const config = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<GameConfig>;

	return {
		schemaVersion: config.schemaVersion,
		allTags: config.allTags ?? [],
		allAttributes: config.allAttributes ?? [],
		allActions: config.allActions ?? [],
		allEffects: config.allEffects,
		allCardReactions: config.allCardReactions,
		cardTemplates: config.cardTemplates ?? [],
		allDialogues: config.allDialogues,
		allAgreements: config.allAgreements,
	};
}

/** 开发环境加载编辑器默认配置；返回已补齐数组字段的 GameConfig。 */
export async function serviceLoadEditorDefaultConfig(): Promise<GameConfig> {
	const response = await fetch(`${import.meta.env.BASE_URL}${DEFAULT_CONFIG_FILE}`);

	if (!response.ok) {
		throw new Error(`编辑器默认配置加载失败：HTTP ${response.status}`);
	}

	return normalizeEditorConfig(await response.json());
}
