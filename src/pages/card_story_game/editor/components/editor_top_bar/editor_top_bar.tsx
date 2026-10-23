import FileImport from "../../../../../components/file_import/file_import.tsx";

import style from "./editor_top_bar.module.scss";

export interface EditorValidationState {
	status: "ok" | "warning" | "error";
	errorCount: number;
	warningCount: number;
}

interface Props {
	configName: string;
	onConfigNameChange: (name: string) => void;
	onImport: (content: string) => void;
	onExport: () => void;
	validation: EditorValidationState;
}

export default function EditorTopBar({ configName, onConfigNameChange, onImport, onExport, validation }: Props) {
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
				<FileImport className={style.toolButton} onFileLoaded={onImport}>
					导入
				</FileImport>
				<button className={style.toolButton} onClick={onExport}>
					导出
				</button>
				{validation.status === "error" && (
					<span className={`${style.statusBadge} ${style.statusError}`}>✗ {validation.errorCount} 错误</span>
				)}
				{validation.status === "warning" && (
					<span className={`${style.statusBadge} ${style.statusWarning}`}>⚠ {validation.warningCount} 警告</span>
				)}
				{validation.status === "ok" && <span className={`${style.statusBadge} ${style.statusOk}`}>✓ 校验通过</span>}
			</div>
		</header>
	);
}
