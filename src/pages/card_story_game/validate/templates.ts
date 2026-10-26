import type { CardTemplate } from "../card_story_game_types.ts";
import { isPlainObject, isPositiveInteger, isString } from "../../../utils/type_guard.ts";
import { parseIdRefs } from "./common.ts";
import type { ValidationIssue } from "./validate_types.ts";

function parseAttributes(raw: unknown, path: string, issues: ValidationIssue[]): Record<string, number> {
	if (raw === undefined) {
		return {};
	}
	if (!isPlainObject(raw)) {
		issues.push({ path, message: "必须是对象" });
		return {};
	}

	const attributes: Record<string, number> = {};
	const keys = Object.keys(raw);

	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const value = raw[key];
		if (typeof value !== "number") {
			issues.push({ path: `${path}.${key}`, message: "必须是数字" });
			continue;
		}
		attributes[key] = value;
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
