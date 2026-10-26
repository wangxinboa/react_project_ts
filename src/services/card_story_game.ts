import type { GameConfig } from "../pages/card_story_game/card_story_game_types.ts";
import { parseConfigShape } from "../pages/card_story_game/validate/index.ts";

export async function serviceGetDefaultConfig(): Promise<GameConfig> {
	// 拼上 Vite 的 base 前缀，保证部署到子路径（如 GitHub Pages）时也能正确取到配置
	const response = await fetch(`${import.meta.env.BASE_URL}card_story_game_default_config.json`);

	if (!response.ok) {
		throw new Error(`网络请求失败: ${response.status}`);
	}

	const data: unknown = await response.json();
	const result = parseConfigShape(data);

	if (!result.ok) {
		let detail = "";
		for (let i = 0; i < result.issues.length; i++) {
			detail += (i > 0 ? "；" : "") + `${result.issues[i].path}：${result.issues[i].message}`;
		}
		throw new Error(`配置文件格式不正确：${detail}`);
	}

	// 语义问题（空 key、重名）不阻断加载，交给编辑器提示
	return result.config;
}
