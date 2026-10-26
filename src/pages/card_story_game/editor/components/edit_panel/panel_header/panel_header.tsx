import style from "./panel_header.module.scss";

interface PanelHeaderProps {
	/** 面包屑根节点，如“标签定义” */
	rootLabel: string;
	/** 当前项名称，如标签 key 或动作 verb */
	currentLabel: string;
	/** 右侧 ID 徽章；没有 id 时不渲染 */
	id?: number | null;
}

export default function PanelHeader({ rootLabel, currentLabel, id }: PanelHeaderProps) {
	return (
		<header className={style.panelHeader}>
			<div className={style.breadcrumb}>
				<span className={style.breadcrumbRoot}>{rootLabel}</span>
				<span className={style.breadcrumbSeparator}>/</span>
				<span className={style.breadcrumbCurrent}>{currentLabel}</span>
			</div>
			{id !== undefined && id !== null && <span className={style.idBadge}>ID #{id}</span>}
		</header>
	);
}
