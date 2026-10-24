import { useRef, useCallback } from "react";
import type { ReactNode, ChangeEvent } from "react";
import styles from "./file_import.module.scss";

interface FileImportProps {
	/** 允许选择的文件后缀，默认只允许 .json */
	accept?: string;
	/** 文件读取成功后的回调，抛出文件内容字符串 */
	onFileLoaded: (content: string) => void;
	/** 读取失败的回调 */
	onError?: (error: Error) => void;
	/** 外部传入的类名，可用于覆盖样式（如把它变成按钮） */
	className?: string;
	/** 触发文件选择的 UI 元素或文本 */
	children: ReactNode;
}

export default function FileImport({ accept = ".json", onFileLoaded, onError, className, children }: FileImportProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	// 1. 处理文件读取成功的回调
	const handleFileRead = useCallback(
		(event: ProgressEvent<FileReader>) => {
			console.log("文件读取成功 event:", event);
			const content = event.target?.result as string;
			if (content) {
				onFileLoaded(content);
			}
		},
		[onFileLoaded],
	);

	// 2. 处理文件读取失败的回调
	const handleFileError = useCallback(() => {
		onError?.(new Error("文件读取失败"));
	}, [onError]);

	// 3. 处理 input 的 onChange 事件
	const handleChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = handleFileRead;
			reader.onerror = handleFileError;

			reader.readAsText(file);

			e.target.value = "";
		},
		[handleFileRead, handleFileError],
	);

	// 4. 处理点击容器触发 input 点击
	const handleClick = useCallback(() => {
		inputRef.current?.click();
	}, []);

	return (
		<div className={`${styles.container} ${className || ""}`} onClick={handleClick}>
			<input type="file" ref={inputRef} accept={accept} onChange={handleChange} className={styles.hiddenInput} />
			{children}
		</div>
	);
}
