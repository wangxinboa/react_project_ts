import { validateFormula } from "../pages/card_story_game/formula/formula_validate.ts";
import type { FamineRefugeeConfig } from "../pages/card_story_game/game/famine_refugee/famine_refugee_types.ts";

export interface FamineSceneEntry {
	id: string;
	label: string;
	file: string;
}

export interface FamineSceneIndex {
	defaultScene: string;
	scenes: FamineSceneEntry[];
}

export async function serviceGetFamineSceneIndex(): Promise<FamineSceneIndex> {
	const response = await fetch(`${import.meta.env.BASE_URL}scenes/index.json`);
	if (!response.ok) {
		throw new Error(`场景索引加载失败：HTTP ${response.status}`);
	}
	const raw: unknown = await response.json();
	if (
		typeof raw !== "object" ||
		raw === null ||
		!Array.isArray((raw as { scenes?: unknown }).scenes) ||
		typeof (raw as { defaultScene?: unknown }).defaultScene !== "string"
	) {
		throw new Error("场景索引格式错误：scenes / defaultScene 缺失");
	}
	return raw as FamineSceneIndex;
}

export async function serviceGetFamineRefugeeConfig(sceneFile = "famine_refugee.json"): Promise<FamineRefugeeConfig> {
	const response = await fetch(`${import.meta.env.BASE_URL}scenes/${sceneFile}`);
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
