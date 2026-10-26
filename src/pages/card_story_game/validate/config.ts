import { isPlainObject } from "../../../utils/type_guard.ts";
import { parseActions } from "./actions.ts";
import { parseTags } from "./tags.ts";
import { parseTemplates } from "./templates.ts";
import type { ConfigShapeResult, ValidationIssue } from "./validate_types.ts";

/**
 * 结构校验 + 归一化，请求加载和导入共用。
 * - 标签 id / key / desc 缺失时在这里补齐
 * - 动作、模板的引用关系在这里校验；AST 内容暂不校验
 * - 成功时返回完整的 GameConfig，调用方不需要再做归一化
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

	const parsedTags = parseTags(allTags, issues);
	const tagIds = parsedTags.tagIds;
	const allRules = parseActions(raw.allRules, issues);
	const actionIds = new Set<number>();
	for (let i = 0; i < allRules.length; i++) {
		actionIds.add(allRules[i].id);
	}

	const cardTemplates = parseTemplates(raw.cardTemplates, actionIds, tagIds, issues);

	if (issues.length > 0) {
		return { ok: false, issues };
	}

	return {
		ok: true,
		config: {
			allTags: parsedTags.tags,
			allRules,
			cardTemplates,
		},
	};
}
