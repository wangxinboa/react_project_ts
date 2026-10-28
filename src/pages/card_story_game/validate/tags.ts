import type { TagItem } from "../card_story_game_types.ts";
import type { ValidationIssue } from "./validate_types.ts";

export interface TagValidationResult {
	/** tagId -> key 错误，供表单直接使用 */
	errorsByTagId: Record<number, string>;
	issues: ValidationIssue[];
}

export function validateTags(tags: TagItem[]): TagValidationResult {
	const keyCounts = new Map<string, number>();
	for (let i = 0; i < tags.length; i++) {
		const key = tags[i].key.trim();
		if (key !== "") {
			keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
		}
	}

	const issues: ValidationIssue[] = [];
	const errorsByTagId: Record<number, string> = {};

	for (let i = 0; i < tags.length; i++) {
		const tag = tags[i];
		const key = tag.key.trim();
		let error = "";

		if (key === "") {
			error = "标签 key 不能为空";
		} else if ((keyCounts.get(key) ?? 0) > 1) {
			error = "key 已被其他标签占用";
		}

		if (error !== "") {
			errorsByTagId[tag.id] = error;
			issues.push({ path: `allTags[${i}].key`, message: error });
		}
	}

	return { errorsByTagId, issues };
}
