import type { CardTemplate, RuleAction, TagItem } from "../card_story_game_types.ts";
import { isPlainObject, isPositiveInteger, isString } from "../../../utils/type_guard.ts";
import { parseIdRefs } from "./common.ts";
import type { ValidationIssue } from "./validate_types.ts";

export interface TemplateValidationResult {
	/** templateId -> key 错误，供表单直接使用 */
	errorsByTemplateId: Record<number, string>;
	issues: ValidationIssue[];
}

/** 返回重复的字段名；空名由字段级 required 处理，这里跳过 */
export function getDuplicateAttributeName(names: string[]): string | null {
	const seen = new Set<string>();
	for (let i = 0; i < names.length; i++) {
		const name = names[i].trim();
		if (name === "") {
			continue;
		}
		if (seen.has(name)) {
			return name;
		}
		seen.add(name);
	}
	return null;
}

/** 编辑器侧模板语义校验：key、字段名、标签/动作引用 */
export function validateTemplates(
	templates: CardTemplate[],
	tags: TagItem[],
	actions: RuleAction[],
): TemplateValidationResult {
	const tagIds = new Set<number>();
	for (let i = 0; i < tags.length; i++) {
		tagIds.add(tags[i].id);
	}
	const actionIds = new Set<number>();
	for (let i = 0; i < actions.length; i++) {
		actionIds.add(actions[i].id);
	}

	const keyCounts = new Map<string, number>();
	for (let i = 0; i < templates.length; i++) {
		const key = templates[i].key.trim();
		if (key !== "") {
			keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
		}
	}

	const issues: ValidationIssue[] = [];
	const errorsByTemplateId: Record<number, string> = {};

	for (let i = 0; i < templates.length; i++) {
		const template = templates[i];
		const path = `cardTemplates[${i}]`;
		const key = template.key.trim();

		let keyError = "";
		if (key === "") {
			keyError = "模板 key 不能为空";
		} else if ((keyCounts.get(key) ?? 0) > 1) {
			keyError = "key 已被其他模板占用";
		}
		if (keyError !== "") {
			errorsByTemplateId[template.id] = keyError;
			issues.push({ path: `${path}.key`, message: keyError });
		}

		const attributeNames = new Set<string>();
		for (let a = 0; a < template.attributes.length; a++) {
			const name = template.attributes[a].name.trim();
			if (name === "") {
				issues.push({ path: `${path}.attributes[${a}].name`, message: "字段名不能为空" });
			} else if (attributeNames.has(name)) {
				issues.push({ path: `${path}.attributes[${a}].name`, message: `字段名「${name}」重复` });
			} else {
				attributeNames.add(name);
			}
		}

		for (let t = 0; t < template.tags.length; t++) {
			if (!tagIds.has(template.tags[t])) {
				issues.push({ path: `${path}.tags[${t}]`, message: `标签 ${template.tags[t]} 不存在` });
			}
		}

		const groups: Array<{ group: "auto" | "outgoing" | "incoming"; ids: number[] }> = [
			{ group: "auto", ids: template.auto },
			{ group: "outgoing", ids: template.outgoing },
			{ group: "incoming", ids: template.incoming },
		];
		for (let g = 0; g < groups.length; g++) {
			const { group, ids } = groups[g];
			const seen = new Set<number>();
			for (let r = 0; r < ids.length; r++) {
				const actionId = ids[r];
				if (!actionIds.has(actionId)) {
					issues.push({ path: `${path}.${group}[${r}]`, message: `动作 ${actionId} 不存在` });
				}
				if (seen.has(actionId)) {
					issues.push({ path: `${path}.${group}[${r}]`, message: `动作 ${actionId} 重复引用` });
				}
				seen.add(actionId);
			}
		}
	}

	return { errorsByTemplateId, issues };
}

function parseAttributes(raw: unknown, path: string, issues: ValidationIssue[]): CardTemplate["attributes"] {
	if (raw === undefined) {
		return [];
	}

	// 新格式：数组；保留旧 object 格式的导入兼容
	if (Array.isArray(raw)) {
		const attributes: CardTemplate["attributes"] = [];
		for (let i = 0; i < raw.length; i++) {
			const item = raw[i];
			const itemPath = `${path}[${i}]`;
			if (!isPlainObject(item)) {
				issues.push({ path: itemPath, message: "必须是对象" });
				continue;
			}
			if (!isString(item.name)) {
				issues.push({ path: `${itemPath}.name`, message: "必须是字符串" });
				continue;
			}
			if (typeof item.value !== "number") {
				issues.push({ path: `${itemPath}.value`, message: "必须是数字" });
				continue;
			}
			attributes.push({ name: item.name, value: item.value });
		}
		return attributes;
	}

	if (!isPlainObject(raw)) {
		issues.push({ path, message: "必须是数组或对象" });
		return [];
	}

	const attributes: CardTemplate["attributes"] = [];
	const keys = Object.keys(raw);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const value = raw[key];
		if (typeof value !== "number") {
			issues.push({ path: `${path}.${key}`, message: "必须是数字" });
			continue;
		}
		attributes.push({ name: key, value });
	}

	return attributes;
}

export function parseTemplates(
	raw: unknown,
	actionIds: Set<number>,
	tagIds: Set<number>,
	issues: ValidationIssue[],
): CardTemplate[] {
	if (raw === undefined) {
		return [];
	}
	if (!Array.isArray(raw)) {
		issues.push({ path: "cardTemplates", message: "必须是数组" });
		return [];
	}

	const templates: CardTemplate[] = [];
	const ids = new Set<number>();

	for (let i = 0; i < raw.length; i++) {
		const item = raw[i];
		const path = `cardTemplates[${i}]`;

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
			issues.push({ path: `${path}.id`, message: "模板 id 重复" });
			continue;
		}

		const key = item.key;
		if (!isString(key) || key.trim() === "") {
			issues.push({ path: `${path}.key`, message: "必须是非空字符串" });
			continue;
		}

		const tags = parseIdRefs(item.tags, `${path}.tags`, tagIds, "标签", issues);
		const attributes = parseAttributes(item.attributes, `${path}.attributes`, issues);
		const auto = parseIdRefs(item.auto, `${path}.auto`, actionIds, "动作", issues);
		const outgoing = parseIdRefs(item.outgoing, `${path}.outgoing`, actionIds, "动作", issues);
		const incoming = parseIdRefs(item.incoming, `${path}.incoming`, actionIds, "动作", issues);

		ids.add(id);
		templates.push({ id, key: key.trim(), tags, attributes, auto, outgoing, incoming });
	}

	return templates;
}
