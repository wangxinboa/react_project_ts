import type { CardTemplate, RuleAction, TagItem } from "../../../card_story_game_types.ts";

import TreeSection from "./components/tree_section.tsx";

import style from "./editor_tree.module.scss";

const getTagLabel = (tag: TagItem) => tag.key.trim() || "未命名";
const getActionLabel = (action: RuleAction) => action.verb.trim() || "未命名";
const getTemplateLabel = (template: CardTemplate) => template.key.trim() || "未命名";

interface EditorTreeProps {
	tags: TagItem[];
	actions: RuleAction[];
	templates: CardTemplate[];
	selectedTagId: number | null;
	selectedActionId: number | null;
	selectedTemplateId: number | null;
	onSelectTag: (id: number) => void;
	onAddTag: () => void;
	onDeleteTag: (id: number) => void;
	onSelectAction: (id: number) => void;
	onAddAction: () => void;
	onDeleteAction: (id: number) => void;
	onSelectTemplate: (id: number) => void;
	onAddTemplate: () => void;
	onDeleteTemplate: (id: number) => void;
}

export default function EditorTree({
	tags,
	actions,
	templates,
	selectedTagId,
	selectedActionId,
	selectedTemplateId,
	onSelectTag,
	onAddTag,
	onDeleteTag,
	onSelectAction,
	onAddAction,
	onDeleteAction,
	onSelectTemplate,
	onAddTemplate,
	onDeleteTemplate,
}: EditorTreeProps) {
	return (
		<div className={style.leftPanel}>
			<TreeSection
				title="标签定义"
				addTitle="添加标签"
				emptyText="暂无标签"
				items={tags}
				getLabel={getTagLabel}
				selectedId={selectedTagId}
				onSelect={onSelectTag}
				onAdd={onAddTag}
				onDelete={onDeleteTag}
			/>
			<TreeSection
				title="动作定义"
				addTitle="添加动作"
				emptyText="暂无动作"
				items={actions}
				getLabel={getActionLabel}
				selectedId={selectedActionId}
				onSelect={onSelectAction}
				onAdd={onAddAction}
				onDelete={onDeleteAction}
			/>
			<TreeSection
				title="卡牌模板"
				addTitle="添加模板"
				emptyText="暂无模板"
				items={templates}
				getLabel={getTemplateLabel}
				selectedId={selectedTemplateId}
				onSelect={onSelectTemplate}
				onAdd={onAddTemplate}
				onDelete={onDeleteTemplate}
			/>
		</div>
	);
}
