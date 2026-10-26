import type { GameConfig } from "../card_story_game_types.ts";

export interface ValidationIssue {
	/** 出错位置，如 allTags[2].key，后续右栏校验列表可以直接复用 */
	path: string;
	message: string;
}

export type ConfigShapeResult = { ok: true; config: GameConfig } | { ok: false; issues: ValidationIssue[] };

export interface TagValidationResult {
	/** tagId -> 错误信息，供表单直接使用；id 是正整数，用对象即可 */
	errorsByTagId: Record<number, string>;
	issues: ValidationIssue[];
}
