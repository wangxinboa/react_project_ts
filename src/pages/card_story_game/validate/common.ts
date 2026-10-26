import type { ValidationIssue } from "./validate_types.ts";
import { isPositiveInteger } from "../../../utils/type_guard.ts";

/** 缺失按空数组处理；存在但不是数组时记录问题 */
export function parseUnknownArray(raw: unknown, path: string, issues: ValidationIssue[]): unknown[] {
	if (raw === undefined) {
		return [];
	}
	if (!Array.isArray(raw)) {
		issues.push({ path, message: "必须是数组" });
		return [];
	}
	return raw;
}

/** 解析 id 引用数组：必须是正整数，且必须存在于 knownIds 中 */
export function parseIdRefs(
	raw: unknown,
	path: string,
	knownIds: Set<number>,
	label: string,
	issues: ValidationIssue[],
): number[] {
	if (raw === undefined) {
		return [];
	}
	if (!Array.isArray(raw)) {
		issues.push({ path, message: "必须是数组" });
		return [];
	}

	const refs: number[] = [];
	for (let i = 0; i < raw.length; i++) {
		const id = raw[i];
		if (!isPositiveInteger(id)) {
			issues.push({ path: `${path}[${i}]`, message: "必须是正整数" });
			continue;
		}
		if (!knownIds.has(id)) {
			issues.push({ path: `${path}[${i}]`, message: `${label} ${id} 不存在` });
			continue;
		}
		refs.push(id);
	}
	return refs;
}
