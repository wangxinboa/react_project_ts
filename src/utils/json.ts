/** 解析 JSON 数组；失败或不是数组时返回 null */
export function parseJsonArray(text: string): unknown[] | null {
	try {
		const value: unknown = JSON.parse(text);
		return Array.isArray(value) ? value : null;
	} catch {
		return null;
	}
}
