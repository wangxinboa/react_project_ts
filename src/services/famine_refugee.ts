import { validateFormula } from "../pages/card_story_game/formula/formula_validate.ts";
import type { FamineRefugeeConfig } from "../pages/card_story_game/game/famine_refugee/famine_refugee_types.ts";

const CONFIG_FILE = "famine_refugee_config.json";

export async function serviceGetFamineRefugeeConfig(): Promise<FamineRefugeeConfig> {
	const response = await fetch(`${import.meta.env.BASE_URL}${CONFIG_FILE}`);
	if (!response.ok) {
		throw new Error(`原型配置加载失败：HTTP ${response.status}`);
	}

	const raw: unknown = await response.json();
	if (
		typeof raw !== "object" ||
		raw === null ||
		!Array.isArray((raw as { allAttributes?: unknown }).allAttributes) ||
		!Array.isArray((raw as { cardTemplates?: unknown }).cardTemplates) ||
		typeof (raw as { saveData?: unknown }).saveData !== "object"
	) {
		throw new Error("原型配置格式错误：allAttributes / cardTemplates / saveData 缺失");
	}
	const config = raw as FamineRefugeeConfig;
	for (let i = 0; i < config.allAttributes.length; i++) {
		const formula = config.allAttributes[i].formula;
		if (!formula) continue;
		const issues = validateFormula(formula, `allAttributes[${i}].formula`);
		if (issues.length > 0) {
			throw new Error(`原型配置公式错误：${issues[0].path} ${issues[0].message}`);
		}
	}
	for (let i = 0; i < config.allActions.length; i++) {
		const issues = validateFormula(config.allActions[i].timeCost, `allActions[${i}].timeCost`);
		if (issues.length > 0) {
			throw new Error(`原型配置时间公式错误：${issues[0].path} ${issues[0].message}`);
		}
	}
	return config;
}
