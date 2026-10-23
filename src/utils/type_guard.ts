/**
 * 与业务无关的通用类型判断。
 * 只收“原子”判断，不放 TagItem / GameConfig 这类领域知识。
 */

export function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isPositiveInteger(value: unknown): value is number {
	return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function isString(value: unknown): value is string {
	return typeof value === "string";
}
