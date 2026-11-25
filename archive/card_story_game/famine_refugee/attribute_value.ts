import type { AttributeValue } from "../../card_story_game_types/index.ts";

/** 读取数字属性；非数字值按 0 处理。 */
export function getNumberAttribute(values: Record<number, AttributeValue>, id: number): number {
	const value = values[id];
	return typeof value === "number" ? value : 0;
}

/** 读取字符串引用属性；不存在或类型不符时返回 undefined。 */
export function getStringAttribute(values: Record<number, AttributeValue>, id: number): string | undefined {
	const value = values[id];
	return typeof value === "string" ? value : undefined;
}

/** 读取引用列表属性；不存在或类型不符时返回空数组。 */
export function getStringListAttribute(values: Record<number, AttributeValue>, id: number): string[] {
	const value = values[id];
	return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

/** 只保留数字属性，供公式和数值条件使用。 */
export function getNumberValues(values: Record<number, AttributeValue>): Record<number, number> {
	const result: Record<number, number> = {};
	const keys = Object.keys(values);
	for (let i = 0; i < keys.length; i++) {
		const id = Number(keys[i]);
		const value = values[id];
		if (typeof value === "number") result[id] = value;
	}
	return result;
}
