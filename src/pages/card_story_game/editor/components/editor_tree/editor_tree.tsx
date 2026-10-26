import type { RuleAction, TagItem } from "../../../card_story_game_types.ts";

import ActionTree from "./action_tree.tsx";
import TagTree from "./tag_tree.tsx";

import style from "./editor_tree.module.scss";

interface EditorTreeProps {
	tags: TagItem[];
	actions: RuleAction[];
	selectedTagId: number | null;
	selectedActionId: number | null;
	onSelectTag: (id: number) => void;
	onAddTag: () => void;
	onDeleteTag: (id: number) => void;
	onSelectAction: (id: number) => void;
	onAddAction: () => void;
	onDeleteAction: (id: number) => void;
}

export default function EditorTree({
	tags,
	actions,
	selectedTagId,
	selectedActionId,
	onSelectTag,
	onAddTag,
	onDeleteTag,
	onSelectAction,
	onAddAction,
	onDeleteAction,
}: EditorTreeProps) {
	return (
		<div className={style.leftPanel}>
			<TagTree
				tags={tags}
				selectedTagId={selectedTagId}
				onSelectTag={onSelectTag}
				onAddTag={onAddTag}
				onDeleteTag={onDeleteTag}
			/>
			<ActionTree
				actions={actions}
				selectedActionId={selectedActionId}
				onSelectAction={onSelectAction}
				onAddAction={onAddAction}
				onDeleteAction={onDeleteAction}
			/>
		</div>
	);
}
