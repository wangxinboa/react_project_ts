/**
 * 通用的文件下载方法
 * @param content 文件的具体内容（字符串）
 * @param filename 文件名（如 'game_config.json'）
 * @param mimeType MIME类型，默认 application/json
 */
export function downloadFile(content: string, filename: string, mimeType: string = "application/json") {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);

	// 释放内存
	URL.revokeObjectURL(url);
}

/**
 * 快捷下载 JSON 数据
 * @param data 需要序列化的对象
 * @param filename 文件名（不需要带 .json 后缀，内部会自动补全）
 */
export function downloadJSON(data: unknown, filename: string) {
	const text = JSON.stringify(data, null, 2);
	const finalFilename = filename.endsWith(".json") ? filename : `${filename}.json`;
	downloadFile(text, finalFilename, "application/json");
}
