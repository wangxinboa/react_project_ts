import { ActionParamType } from "../card_story_game_types.ts";
import type { ActionParam, RuleAction } from "../card_story_game_types.ts";
import { isPlainObject, isPositiveInteger, isString } from "../../../utils/type_guard.ts";
import { parseUnknownArray } from "./common.ts";
import type { ValidationIssue } from "./validate_types.ts";

const ACTION_PARAM_TYPE_VALUES: readonly ActionParamType[] = Object.values(ActionParamType);
const ALLOWED_PARAM_TYPES_TEXT = ACTION_PARAM_TYPE_VALUES.map((type) => `"${type}"`).join(" / ");

function isActionParamType(value: unknown): value is ActionParamType {
	if (typeof value !== "string") {
		return false;
	}
	for (let i = 0; i < ACTION_PARAM_TYPE_VALUES.length; i++) {
		if (value === ACTION_PARAM_TYPE_VALUES[i]) {
			return true;
		}
	}
	return false;
}

export interface ActionValidationResult {
	issues: ValidationIssue[];
}

/** 编辑器侧动作语义校验：verb 不能为空，参数名不能为空 / 重复 */
export function validateActions(actions: RuleAction[]): ActionValidationResult {
	const issues: ValidationIssue[] = [];

	for (let i = 0; i < actions.length; i++) {
		const action = actions[i];
		const path = `allRules[${i}]`;

		if (action.verb.trim() === "") {
			issues.push({ path: `${path}.verb`, message: "verb 不能为空" });
		}

		const names = new Set<string>();
		for (let j = 0; j < action.params.length; j++) {
			const name = action.params[j].name.trim();
			if (name === "") {
				issues.push({ path: `${path}.params[${j}].name`, message: "参数名不能为空" });
				continue;
			}
			if (names.has(name)) {
				issues.push({ path: `${path}.params[${j}].name`, message: `参数名「${name}」重复` });
				continue;
			}
			names.add(name);
		}
	}

	return { issues };
}

/** 返回重复的参数名；空名由字段级 required 处理，这里跳过 */
export function getDuplicateActionParamName(params: ActionParam[]): string | null {
	const names = new Set<string>();
	for (let i = 0; i < params.length; i++) {
		const name = params[i].name.trim();
		if (name === "") {
			continue;
		}
		if (names.has(name)) {
			return name;
		}
		names.add(name);
	}
	return null;
}

/** 动作参数的领域规则：card 参数不允许带 default */
export function normalizeActionParams(params: ActionParam[]): ActionParam[] {
	return params.map((param) => {
		if (param.type === ActionParamType.CARD && "default" in param) {
			return { name: param.name, type: param.type };
		}
		return param;
	});
}

function parseParams(raw: unknown, path: string, issues: ValidationIssue[]): ActionParam[] {
	if (raw === undefined) {
		return [];
	}
	if (!Array.isArray(raw)) {
		issues.push({ path, message: "必须是数组" });
		return [];
	}

	const params: ActionParam[] = [];
	const names = new Set<string>();

	for (let i = 0; i < raw.length; i++) {
		const item = raw[i];
		const itemPath = `${path}[${i}]`;

		if (!isPlainObject(item)) {
			issues.push({ path: itemPath, message: "必须是对象" });
			continue;
		}

		if (!isString(item.name) || item.name.trim() === "") {
			issues.push({ path: `${itemPath}.name`, message: "必须是非空字符串" });
			continue;
		}

		const name = item.name.trim();
		if (names.has(name)) {
			issues.push({ path: `${itemPath}.name`, message: "参数名重复" });
			continue;
		}
		names.add(name);

		const type = item.type;
		if (!isActionParamType(type)) {
			issues.push({ path: `${itemPath}.type`, message: `必须是 ${ALLOWED_PARAM_TYPES_TEXT}` });
			continue;
		}

		const param: ActionParam = { name, type };
		if ("default" in item) {
			if (typeof item.default !== "number") {
				issues.push({ path: `${itemPath}.default`, message: "必须是数字" });
			} else {
				param.default = item.default;
			}
		}

		params.push(param);
	}

	return normalizeActionParams(params);
}

export function parseActions(raw: unknown, issues: ValidationIssue[]): RuleAction[] {
	if (raw === undefined) {
		return [];
	}
	if (!Array.isArray(raw)) {
		issues.push({ path: "allRules", message: "必须是数组" });
		return [];
	}

	const actions: RuleAction[] = [];
	const ids = new Set<number>();

	for (let i = 0; i < raw.length; i++) {
		const item = raw[i];
		const path = `allRules[${i}]`;

		if (!isPlainObject(item)) {
			issues.push({ path, message: "必须是对象" });
			continue;
		}

		const id = item.id;
		if (!isPositiveInteger(id)) {
			issues.push({ path: `${path}.id`, message: "必须是正整数" });
			continue;
		}
		if (ids.has(id)) {
			issues.push({ path: `${path}.id`, message: "动作 id 重复" });
			continue;
		}

		const verb = item.verb;
		if (!isString(verb) || verb.trim() === "") {
			issues.push({ path: `${path}.verb`, message: "必须是非空字符串" });
			continue;
		}

		const params = parseParams(item.params, `${path}.params`, issues);
		const targets = parseUnknownArray(item.targets, `${path}.targets`, issues);
		const conditions = parseUnknownArray(item.conditions, `${path}.conditions`, issues);
		const effects = parseUnknownArray(item.effects, `${path}.effects`, issues);

		ids.add(id);
		actions.push({ id, verb: verb.trim(), params, targets, conditions, effects });
	}

	return actions;
}
