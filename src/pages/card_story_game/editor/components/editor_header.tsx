import { memo } from "react";

import style from "./editor_header.module.scss";

/** 编辑器顶部栏：品牌、工作区状态。 */
const EditorHeader = memo(function EditorHeader() {
	return (
		<header className={style.header}>
			<div className={style.brand}>
				<span className={style.brandMark}>◆</span>
				<span className={style.brandText}>卡牌故事编辑器</span>
			</div>

			<span className={style.separator} />

			<span className={style.workspace}>未加载配置</span>

			<div className={style.status}>
				<span className={style.statusDot} />
				<span>空工作区</span>
			</div>
		</header>
	);
});

export default EditorHeader;
