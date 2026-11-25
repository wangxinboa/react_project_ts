import { memo } from "react";
import { ExportOutlined, ImportOutlined } from "@ant-design/icons";
import { Button } from "antd";

import style from "./editor_header.module.scss";

/** 编辑器顶部栏：品牌、导入导出入口。 */
const EditorHeader = memo(function EditorHeader() {
	return (
		<header className={style.header}>
			<div className={style.brand}>
				<span className={style.brandMark}>◆</span>
				<span className={style.brandText}>卡牌故事编辑器</span>
			</div>

			<span className={style.separator} />

			<span className={style.workspace}>未加载配置</span>

			<div className={style.actions}>
				<Button icon={<ImportOutlined />} disabled title="导入功能待实现">
					导入
				</Button>
				<Button icon={<ExportOutlined />} disabled title="导出功能待实现">
					导出
				</Button>
			</div>
		</header>
	);
});

export default EditorHeader;
