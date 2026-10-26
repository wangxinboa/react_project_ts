import type { MouseEvent } from "react";

import style from "./editor_tree.module.scss";

interface TreeItemProps {
	/** 当前节点是否选中 */
	active: boolean;
	/** 主展示文案 */
	label: string;
	/** 可选的右侧元信息，如动作 #id */
	meta?: string;
	onSelect: () => void;
	onDelete: () => void;
}

export default function TreeItem({ active, label, meta, onSelect, onDelete }: TreeItemProps) {
	// 删除按钮在节点内部，阻止冒泡属于节点的交互细节
	const handleDelete = (e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		onDelete();
	};

	return (
		<div className={`${style.treeItem} ${active ? style.treeItemActive : ""}`} onClick={onSelect}>
			<span className={style.treeItemLabel}>{label}</span>
			{meta !== undefined && <span className={style.treeItemMeta}>{meta}</span>}
			<button className={style.treeItemDelete} title="删除" onClick={handleDelete}>
				×
			</button>
		</div>
	);
}
