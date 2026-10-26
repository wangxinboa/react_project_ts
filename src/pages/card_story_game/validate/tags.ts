import type { TagItem } from "../card_story_game_types.ts";
import { isPlainObject, isPositiveInteger, isString } from "../../../utils/type_guard.ts";
import type { TagValidationResult, ValidationIssue } from "./validate_types.ts";

/** 已通过结构检查、但尚未补 id / key / desc 的标签 */
interface RawTag {
	id?: number;
	key?: string;
	desc?: string;
}

interface ParsedTags {
	tags: TagItem[];
	tagIds: Set<number>;
}

/**
 * 标签结构校验 + 归一化：补 id / key / desc，返回最终标签和 id 集合。
 * tagIds 基于归一化后的结果，重复 id 被重新分配后也能正确校验模板引用。
 */
export function parseTags(allTags: unknown[], issues: ValidationIssue[]): ParsedTags {
	const tags: RawTag[] = [];

	for (let i = 0; i < allTags.length; i++) {
		const tag = allTags[i];

		if (!isPlainObject(tag)) {
			issues.push({ path: `allTags[${i}]`, message: "必须是对象" });
			continue;
		}

		const raw: RawTag = {};

		if ("id" in tag) {
			if (!isPositiveInteger(tag.id)) {
				issues.push({ path: `allTags[${i}].id`, message: "必须是正整数" });
			} else {
				raw.id = tag.id;
			}
		}

		if ("key" in tag) {
			if (!isString(tag.key)) {
				issues.push({ path: `allTags[${i}].key`, message: "必须是字符串" });
			} else {
				raw.key = tag.key;
			}
		}

		if ("desc" in tag) {
			if (!isString(tag.desc)) {
				issues.push({ path: `allTags[${i}].desc`, message: "必须是字符串" });
			} else {
				raw.desc = tag.desc;
			}
		}

		tags.push(raw);
	}

	const normalizedTags = normalizeTags(tags);
	const tagIds = new Set<number>();
	for (let i = 0; i < normalizedTags.length; i++) {
		tagIds.add(normalizedTags[i].id);
	}

	return { tags: normalizedTags, tagIds };
}

/**
 * 把原始标签数据归一化成 TagItem[]：
 * - 合法且未被占用的 id 原样保留（规则引用才不会断）
 * - 缺失 / 非法（含重复）的 id，从小到大补一个空号
 * - key / desc 缺失时补空字符串
 */
function normalizeTags(rawTags: RawTag[]): TagItem[] {
	const reservedIds = new Set<number>();

	for (let i = 0; i < rawTags.length; i++) {
		const item = rawTags[i];
		if (isPositiveInteger(item.id)) {
			reservedIds.add(item.id);
		}
	}

	const claimedIds = new Set<number>();
	const tags: TagItem[] = [];
	let cursor = 1;

	for (let i = 0; i < rawTags.length; i++) {
		const source = rawTags[i];
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
