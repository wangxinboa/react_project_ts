import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { CaretDownOutlined, CaretRightOutlined } from "@ant-design/icons";

import style from "./editor_tree.module.scss";

interface TreeGroupProps {
	title: string;
	count: number;
	addTitle: string;
	onAdd: () => void;
	children: ReactNode;
}

export default function TreeGroup({ title, count, addTitle, onAdd, children }: TreeGroupProps) {
	const [expanded, setExpanded] = useState(true);

	const handleToggle = useCallback(() => {
		setExpanded((v) => !v);
	}, []);

	const handleAdd = useCallback(() => {
		setExpanded(true);
		onAdd();
	}, [onAdd]);

	return (
		<div className={style.treeGroup}>
			<div className={style.treeGroupHeader}>
				<button className={style.treeGroupToggle} onClick={handleToggle} title={expanded ? "收起" : "展开"}>
					{expanded ? (
						<CaretDownOutlined className={style.treeGroupArrow} />
					) : (
						<CaretRightOutlined className={style.treeGroupArrow} />
					)}
					<span className={style.treeGroupTitle}>{title}</span>
					<span className={style.treeGroupCount}>{count}</span>
				</button>
				<button className={style.treeGroupAdd} title={addTitle} onClick={handleAdd}>
					+
				</button>
			</div>

			{expanded && <div className={style.treeItems}>{children}</div>}
		</div>
	);
}
