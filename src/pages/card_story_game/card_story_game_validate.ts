import type { GameConfig, TagItem } from "./card_story_game_types.ts";
import { isPlainObject, isPositiveInteger, isString } from "../../utils/type_guard.ts";

export interface ValidationIssue {
	/** 出错位置，如 allTags[2].key，后续右栏校验列表可以直接复用 */
	path: string;
	message: string;
}

/** 通过结构校验后的原始配置：标签还没补 id，其余根字段原样保留 */
export interface ParsedGameConfig {
	allTags: unknown[];
	allRules: Record<string, unknown>;
	cardTemplates: unknown[];
}

export type ConfigShapeResult = { ok: true; config: ParsedGameConfig } | { ok: false; issues: ValidationIssue[] };

/**
 * 结构校验 + 提取三个根字段，请求加载和导入共用。
 * - id 缺失是允许的，normalizeConfig 会补
 * - key / desc 缺失也允许，补空串后由 validateTags 作为语义问题提示
 * - allRules / cardTemplates 现在没有编辑界面，但必须原样保留
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

	if ("allRules" in raw && !isPlainObject(raw.allRules)) {
		issues.push({ path: "allRules", message: "必须是对象" });
	}

	if ("cardTemplates" in raw && !Array.isArray(raw.cardTemplates)) {
		issues.push({ path: "cardTemplates", message: "必须是数组" });
	}

	if (issues.length > 0) {
		return { ok: false, issues };
	}

	return {
		ok: true,
		config: {
			allTags,
			allRules: isPlainObject(raw.allRules) ? raw.allRules : {},
			cardTemplates: Array.isArray(raw.cardTemplates) ? raw.cardTemplates : [],
		},
	};
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

/** 归一化完整配置：标签补 id，allRules / cardTemplates 原样保留 */
export function normalizeConfig(parsed: ParsedGameConfig): GameConfig {
	return {
		allTags: normalizeTags(parsed.allTags),
		allRules: parsed.allRules,
		cardTemplates: parsed.cardTemplates,
	};
}

export interface TagValidationResult {
	/** tagId -> 错误信息，供表单直接使用；id 是正整数，用对象即可 */
	errorsByTagId: Record<number, string>;
	issues: ValidationIssue[];
}

/**
 * 语义校验：只提示，不阻断加载 / 导入。
 * 先用一次遍历统计 key 出现次数，再遍历一次生成错误，复杂度 O(n)。
 */
export function validateTags(tags: TagItem[]): TagValidationResult {
	// key 来自用户输入，用 Map 避免 __proto__ 等原型键冲突
	const keyCounts = new Map<string, number>();

	for (let i = 0; i < tags.length; i++) {
		const key = tags[i].key.trim();
		if (key !== "") {
			keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
		}
	}

	const errorsByTagId: Record<number, string> = {};
	const issues: ValidationIssue[] = [];

	for (let i = 0; i < tags.length; i++) {
		const tag = tags[i];
		const key = tag.key.trim();
		let message: string | null = null;

		if (key === "") {
			message = "标签 key 不能为空";
		} else if ((keyCounts.get(key) ?? 0) > 1) {
			message = "key 已被其他标签占用";
		}

		if (message !== null) {
			errorsByTagId[tag.id] = message;
			issues.push({ path: `allTags[${i}].key`, message });
		}
	}

	return { errorsByTagId, issues };
}
