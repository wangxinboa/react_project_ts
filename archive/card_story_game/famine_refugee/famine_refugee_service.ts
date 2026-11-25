import { validateFormula } from "../pages/card_story_game/formula/formula_validate.ts";
import { AttributeType } from "../pages/card_story_game/card_story_game_types/attribute_types/attribute_types.ts";
import type { FamineRefugeeConfig } from "./famine_refugee_types.ts";

export interface FamineSceneEntry {
	id: string;
	label: string;
	configFile: string;
	saveFile: string;
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

export async function serviceGetFamineRefugeeConfig(
	configFile = "famine_refugee_config.json",
	saveFile = "famine_refugee_save.json",
): Promise<FamineRefugeeConfig> {
	const [configResponse, saveResponse] = await Promise.all([
		fetch(`${import.meta.env.BASE_URL}scenes/${configFile}`),
		fetch(`${import.meta.env.BASE_URL}scenes/${saveFile}`),
	]);
	if (!configResponse.ok) throw new Error(`原型配置加载失败：HTTP ${configResponse.status}`);
	if (!saveResponse.ok) throw new Error(`原型存档加载失败：HTTP ${saveResponse.status}`);
	const configRaw: unknown = await configResponse.json();
	const saveRaw: unknown = await saveResponse.json();
	if (
		typeof configRaw !== "object" || configRaw === null ||
		!Array.isArray((configRaw as { allAttributes?: unknown }).allAttributes) ||
		!Array.isArray((configRaw as { cardTemplates?: unknown }).cardTemplates) ||
		!Array.isArray((configRaw as { allActions?: unknown }).allActions) ||
		typeof saveRaw !== "object" || saveRaw === null ||
		typeof (saveRaw as { saveData?: unknown }).saveData !== "object"
	) {
		throw new Error("原型配置格式错误：config 或 save 缺失");
	}
	const config = { ...(configRaw as object), ...(saveRaw as object) } as FamineRefugeeConfig;
	for (let i = 0; i < config.allAttributes.length; i++) {
		const definition = config.allAttributes[i];
		if (definition.type !== AttributeType.DERIVED_NUMBER) continue;
		const issues = validateFormula(definition.formula, `allAttributes[${i}].formula`);
		if (issues.length > 0) throw new Error(`原型配置公式错误：${issues[0].path} ${issues[0].message}`);
	}
	for (let i = 0; i < config.allActions.length; i++) {
		const issues = validateFormula(config.allActions[i].timeCost, `allActions[${i}].timeCost`);
		if (issues.length > 0) throw new Error(`原型配置时间公式错误：${issues[0].path} ${issues[0].message}`);
	}
	for (let i = 0; i < config.cardTemplates.length; i++) {
		const template = config.cardTemplates[i];
		for (let j = 0; j < (template.attributes ?? []).length; j++) {
			const init = template.attributes?.[j];
			if (init?.type === "initBaseNumber" && typeof init.value !== "number") {
				throw new Error(`模板属性初始化必须是静态数字：cardTemplates[${i}].attributes[${j}]`);
			}
		}
	}
	return config;
}
