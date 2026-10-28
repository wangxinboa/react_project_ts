import style from "../editor_tree.module.scss";
import TreeGroup from "./tree_group.tsx";
import TreeItem from "./tree_item.tsx";

interface TreeSectionProps<T extends { id: number }> {
	title: string;
	addTitle: string;
	emptyText: string;
	items: T[];
	getLabel: (item: T) => string;
	selectedId: number | null;
	onSelect: (id: number) => void;
	onAdd: () => void;
	onDelete: (id: number) => void;
}

/** 通用树分组：一组带 id 的实体，显示文案由 getLabel 决定 */
export default function TreeSection<T extends { id: number }>({
	title,
	addTitle,
	emptyText,
	items,
	getLabel,
	selectedId,
	onSelect,
	onAdd,
	onDelete,
}: TreeSectionProps<T>) {
	return (
		<TreeGroup title={title} count={items.length} addTitle={addTitle} onAdd={onAdd}>
			{items.map((item) => (
				<TreeItem
					key={item.id}
					active={selectedId === item.id}
					label={getLabel(item)}
					meta={`#${item.id}`}
					onSelect={() => onSelect(item.id)}
					onDelete={() => onDelete(item.id)}
				/>
			))}
			{items.length === 0 && <div className={style.treeEmpty}>{emptyText}</div>}
		</TreeGroup>
	);
}
