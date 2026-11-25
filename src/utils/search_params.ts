const registeredSearchParamKeys = new Set<string>();

/** 注册查询参数 key；重复注册直接报错，避免多个页面隐式争用同一个参数名。 */
export function registerSearchParamKey(key: string): void {
	const normalized = key.trim();

	if (normalized === "") {
		throw new Error("URL 查询参数 key 不能为空");
	}

	if (registeredSearchParamKeys.has(normalized)) {
		throw new Error(`URL 查询参数重复注册：${normalized}`);
	}

	registeredSearchParamKeys.add(normalized);
}
