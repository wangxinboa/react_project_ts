import type { RuleAction } from "../../../card_story_game_types.ts";

import style from "./editor_tree.module.scss";
import TreeGroup from "./components/tree_group.tsx";
import TreeItem from "./components/tree_item.tsx";

interface ActionTreeProps {
	actions: RuleAction[];
	selectedActionId: number | null;
	onSelectAction: (id: number) => void;
	onAddAction: () => void;
	onDeleteAction: (id: number) => void;
}

export default function ActionTree({
	actions,
	selectedActionId,
	onSelectAction,
	onAddAction,
	onDeleteAction,
}: ActionTreeProps) {
	return (
		<TreeGroup title="动作定义" count={actions.length} addTitle="添加动作" onAdd={onAddAction}>
			{actions.map((action) => (
				<TreeItem
					key={action.id}
					active={selectedActionId === action.id}
					label={action.verb.trim() || "未命名"}
					meta={`#${action.id}`}
					onSelect={() => onSelectAction(action.id)}
					onDelete={() => onDeleteAction(action.id)}
				/>
			))}
			{actions.length === 0 && <div className={style.treeEmpty}>暂无动作</div>}
		</TreeGroup>
	);
}
