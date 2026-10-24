import { useCallback, useState } from "react";
import type { MouseEvent } from "react";
import { CaretDownOutlined, CaretRightOutlined } from "@ant-design/icons";

import type { TagItem } from "../../../card_story_game_types.ts";

import style from "./tag_tree.module.scss";

interface TagTreeProps {
	tags: TagItem[];
	selectedTagId: number | null;
	onSelectTag: (id: number) => void;
	onAddTag: () => void;
	onDeleteTag: (id: number) => void;
}

export default function TagTree({ tags, selectedTagId, onSelectTag, onAddTag, onDeleteTag }: TagTreeProps) {
	// 展开/收起是纯展示状态，留在树组件内部
	const [expanded, setExpanded] = useState(true);

	const handleToggle = useCallback(() => {
		setExpanded((v) => !v);
	}, []);

	const handleAdd = useCallback(() => {
		setExpanded(true);
		onAddTag();
	}, [onAddTag]);

	// 删除按钮在树节点内部，阻止冒泡属于树的交互细节
	const handleDelete = useCallback(
		(e: MouseEvent<HTMLButtonElement>, id: number) => {
			e.stopPropagation();
			onDeleteTag(id);
		},
		[onDeleteTag],
	);

	return (
		<div className={style.leftPanel}>
			<div className={style.treeGroup}>
				<div className={style.treeGroupHeader}>
					<button className={style.treeGroupToggle} onClick={handleToggle} title={expanded ? "收起" : "展开"}>
						{expanded ? (
							<CaretDownOutlined className={style.treeGroupArrow} />
						) : (
							<CaretRightOutlined className={style.treeGroupArrow} />
						)}
						<span className={style.treeGroupTitle}>标签定义</span>
						<span className={style.treeGroupCount}>{tags.length}</span>
					</button>
					<button className={style.treeGroupAdd} title="添加标签" onClick={handleAdd}>
						+
					</button>
				</div>

				{expanded && (
					<div className={style.treeItems}>
						{tags.map((tag) => (
							<div
								key={tag.id}
								className={`${style.treeItem} ${selectedTagId === tag.id ? style.treeItemActive : ""}`}
								onClick={() => onSelectTag(tag.id)}
							>
								<span className={style.treeItemLabel}>{tag.key.trim() || "未命名"}</span>
								<button className={style.treeItemDelete} title="删除" onClick={(e) => handleDelete(e, tag.id)}>
									×
								</button>
							</div>
						))}
						{tags.length === 0 && <div className={style.treeEmpty}>暂无标签</div>}
					</div>
				)}
			</div>
		</div>
	);
}
