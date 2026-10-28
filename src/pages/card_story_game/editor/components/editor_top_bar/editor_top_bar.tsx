import { CheckCircleFilled, CloseCircleFilled, ExportOutlined, ImportOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";

import style from "./editor_top_bar.module.scss";

interface EditorTopBarProps {
	configName: string;
	onConfigNameChange: (value: string) => void;
	validationStatus?: "ok" | "error";
}

export default function EditorTopBar({
	configName,
	onConfigNameChange,
	validationStatus = "ok",
}: EditorTopBarProps) {
	const isError = validationStatus === "error";

	return (
		<header className={style.topBar}>
			<div className={style.brand}>
				<span className={style.brandMark}>◆</span>
				<span className={style.brandText}>卡牌故事编辑器</span>
			</div>

			<div className={style.configName}>
				<Input
					value={configName}
					onChange={(e) => onConfigNameChange(e.target.value)}
					variant="borderless"
					placeholder="配置名"
					aria-label="配置名"
				/>
			</div>

			<div className={style.actions}>
				<Button icon={<ImportOutlined />}>导入</Button>
				<Button icon={<ExportOutlined />}>导出</Button>
				<span className={isError ? style.statusError : style.statusOk}>
					{isError ? (
						<CloseCircleFilled className={style.statusIcon} />
					) : (
						<CheckCircleFilled className={style.statusIcon} />
					)}
					{isError ? "校验未通过" : "校验通过"}
				</span>
			</div>
		</header>
	);
}
