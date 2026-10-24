import type { TagItem } from "./card_story_game_types.ts";
import { isPlainObject, isPositiveInteger, isString } from "../../utils/type_guard.ts";

export interface ValidationIssue {
	/** 出错位置，如 allTags[2].key，后续右栏校验列表可以直接复用 */
	path: string;
	message: string;
}

export type ConfigShapeResult = { ok: true; allTags: unknown[] } | { ok: false; issues: ValidationIssue[] };

/**
 * 结构校验 + 提取 allTags，请求加载和导入共用。
 * 返回可辨识联合：ok 时直接把通过校验的 allTags 带出来，调用方不需要再写类型断言。
 * - id 缺失是允许的，normalizeTags 会补
 * - key / desc 缺失也允许，补空串后由 validateTags 作为语义问题提示
 */
export function parseConfigShape(raw: unknown): ConfigShapeResult {
	if (!isPlainObject(raw)) {
		return { ok: false, issues: [{ path: "root", message: "必须是对象" }] };
	}

	if (!Array.isArray(raw.allTags)) {
		return { ok: false, issues: [{ path: "allTags", message: "必须是数组" }] };
	}

	const allTags: unknown[] = raw.allTags;
	const issues: ValidationIssue[] = [];

	for (let i = 0; i < allTags.length; i++) {
		const tag = allTags[i];

		if (!isPlainObject(tag)) {
			issues.push({ path: `allTags[${i}]`, message: "必须是对象" });
			continue;
		}

		if ("id" in tag && !isPositiveInteger(tag.id)) {
			issues.push({ path: `allTags[${i}].id`, message: "必须是正整数" });
		}

		if ("key" in tag && !isString(tag.key)) {
			issues.push({ path: `allTags[${i}].key`, message: "必须是字符串" });
		}

		if ("desc" in tag && !isString(tag.desc)) {
			issues.push({ path: `allTags[${i}].desc`, message: "必须是字符串" });
		}
	}

	// allRules / cardTemplates 还没实现，但既然配置里带了，就顺手校验类型
	if ("allRules" in raw && !isPlainObject(raw.allRules)) {
		issues.push({ path: "allRules", message: "必须是对象" });
	}

	if ("cardTemplates" in raw && !Array.isArray(raw.cardTemplates)) {
		issues.push({ path: "cardTemplates", message: "必须是数组" });
	}

	if (issues.length > 0) {
		return { ok: false, issues };
	}

	return { ok: true, allTags };
}

/**
 * 把原始标签数据归一化成 TagItem[]：
 * - 合法且未被占用的 id 原样保留（规则引用才不会断）
 * - 缺失 / 非法（含重复）的 id，从小到大补一个空号
 * - key / desc 缺失时补空字符串
 */
export function normalizeTags(rawTags: unknown[]): TagItem[] {
	const reservedIds = new Set<number>();

	for (let i = 0; i < rawTags.length; i++) {
		const item = rawTags[i];
		if (isPlainObject(item) && isPositiveInteger(item.id)) {
			reservedIds.add(item.id);
		}
	}

	const claimedIds = new Set<number>();
	const tags: TagItem[] = [];
	let cursor = 1;

	for (let i = 0; i < rawTags.length; i++) {
		const raw = rawTags[i];
		const source = isPlainObject(raw) ? raw : {};
		let id: number;

		if (isPositiveInteger(source.id) && !claimedIds.has(source.id)) {
			id = source.id;
		} else {
			while (reservedIds.has(cursor) || claimedIds.has(cursor)) {
				cursor++;
			}
			id = cursor;
		}

		claimedIds.add(id);

		tags.push({
			id,
			key: isString(source.key) ? source.key : "",
			desc: isString(source.desc) ? source.desc : "",
		});
	}

	return tags;
}

/**
 * 单个标签的 key 问题。
 * TagForm 的行内提示和 validateTags 的全局统计共用这一份判断，避免两处各写一遍。
 */
export function getTagKeyError(tag: TagItem, tags: TagItem[]): string | null {
	const key = tag.key.trim();

	if (key === "") {
		return "标签 key 不能为空";
	}

	for (let i = 0; i < tags.length; i++) {
		const other = tags[i];
		if (other.id !== tag.id && other.key.trim() === key) {
			return "key 已被其他标签占用";
		}
	}

	return null;
}

/** 语义校验：只提示，不阻断加载 / 导入 */
export function validateTags(tags: TagItem[]): ValidationIssue[] {
	const issues: ValidationIssue[] = [];

	for (let i = 0; i < tags.length; i++) {
		const message = getTagKeyError(tags[i], tags);
		if (message !== null) {
			issues.push({ path: `allTags[${i}].key`, message });
		}
	}

	return issues;
}
