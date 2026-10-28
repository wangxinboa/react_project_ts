import FileImport from "../../../../../components/file_import/file_import.tsx";

import style from "./editor_top_bar.module.scss";

export interface EditorValidationState {
	status: "ok" | "warning" | "error";
	errorCount: number;
	warningCount: number;
}

interface EditorTopBarProps {
	configName: string;
	onConfigNameChange: (name: string) => void;
	onImport: (content: string) => void;
	onExport: () => void;
	validation: EditorValidationState;
	/** 配置加载中时禁用导入 / 导出，避免和初始化竞态 */
	disabled?: boolean;
}

export default function EditorTopBar({
	configName,
	onConfigNameChange,
	onImport,
	onExport,
	validation,
	disabled = false,
}: EditorTopBarProps) {
	return (
		<header className={style.topBar}>
			<div className={style.topLeft}>
				<input
					className={style.configName}
					value={configName}
					onChange={(e) => onConfigNameChange(e.target.value)}
					placeholder="配置名"
					spellCheck={false}
				/>
			</div>

			<div className={style.topActions}>
				<FileImport
					className={`${style.toolButton} ${disabled ? style.toolButtonDisabled : ""}`}
					onFileLoaded={onImport}
					disabled={disabled}
				>
					导入
				</FileImport>
				<button className={style.toolButton} onClick={onExport} disabled={disabled}>
					导出
				</button>
				{!disabled && validation.status === "error" && (
					<span className={`${style.statusBadge} ${style.statusError}`}>✗ {validation.errorCount} 错误</span>
				)}
				{!disabled && validation.status === "warning" && (
					<span className={`${style.statusBadge} ${style.statusWarning}`}>⚠ {validation.warningCount} 警告</span>
				)}
				{!disabled && validation.status === "ok" && (
					<span className={`${style.statusBadge} ${style.statusOk}`}>✓ 校验通过</span>
				)}
			</div>
		</header>
	);
}
