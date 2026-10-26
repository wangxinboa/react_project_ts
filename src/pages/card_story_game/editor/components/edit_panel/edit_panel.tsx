import type { ReactNode } from "react";

import PanelHeader from "./panel_header/panel_header.tsx";

import style from "./edit_panel.module.scss";

interface EditPanelProps {
	rootLabel: string;
	currentLabel: string;
	id?: number | null;
	children: ReactNode;
}

/** 标签 / 动作编辑区共用的外壳：面板容器 + 顶部面包屑 */
export default function EditPanel({ rootLabel, currentLabel, id, children }: EditPanelProps) {
	return (
		<section className={style.editPanel}>
			<PanelHeader rootLabel={rootLabel} currentLabel={currentLabel} id={id} />
			{children}
		</section>
	);
}
