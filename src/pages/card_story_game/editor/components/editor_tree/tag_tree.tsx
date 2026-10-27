import type { TagItem } from "../../../card_story_game_types.ts";

import style from "./editor_tree.module.scss";
import TreeGroup from "./components/tree_group.tsx";
import TreeItem from "./components/tree_item.tsx";

interface TagTreeProps {
	tags: TagItem[];
	selectedTagId: number | null;
	onSelectTag: (id: number) => void;
	onAddTag: () => void;
	onDeleteTag: (id: number) => void;
}

export default function TagTree({ tags, selectedTagId, onSelectTag, onAddTag, onDeleteTag }: TagTreeProps) {
	return (
		<TreeGroup title="标签定义" count={tags.length} addTitle="添加标签" onAdd={onAddTag}>
			{tags.map((tag) => (
				<TreeItem
					key={tag.id}
					active={selectedTagId === tag.id}
					label={tag.key.trim() || "未命名"}
					meta={`#${tag.id}`}
					onSelect={() => onSelectTag(tag.id)}
					onDelete={() => onDeleteTag(tag.id)}
				/>
			))}
			{tags.length === 0 && <div className={style.treeEmpty}>暂无标签</div>}
		</TreeGroup>
	);
}
