import { memo } from "react";

import type { AttributeDefinition, GameConfig } from "../../card_story_game_types/index.ts";
import { EditorMenuKey } from "../components/editor_menu/editor_menu_meta.ts";
import AttributePage from "./attribute_page/attribute_page.tsx";
import style from "./editor_section.module.scss";

interface EmptySectionProps {
	title: string;
}

const EmptySection = memo(function EmptySection({ title }: EmptySectionProps) {
	return (
		<div className={style.placeholder}>
			<div className={style.placeholderMark}>◇</div>
			<div className={style.placeholderTitle}>{title}</div>
			<div className={style.placeholderDesc}>下一步先接配置工作区，再按模块补编辑表单。</div>
		</div>
	);
});

interface EditorSectionProps {
	activeKey: EditorMenuKey;
	pageTitle: string;
	config: GameConfig | null;
	onAttributesChange: (updater: (prev: AttributeDefinition[]) => AttributeDefinition[]) => void;
}

/** 编辑器内容区：按菜单 key 集中选择页面。 */
const EditorSection = memo(function EditorSection({
	activeKey,
	pageTitle,
	config,
	onAttributesChange,
}: EditorSectionProps) {
	switch (activeKey) {
		case EditorMenuKey.ATTRIBUTES:
			if (!config) return <EmptySection title="配置未加载" />;
			return <AttributePage attributes={config.allAttributes} onAttributesChange={onAttributesChange} />;
		default:
			return <EmptySection title={`${pageTitle}模块尚未接入`} />;
	}
});

export default EditorSection;
