import { useMemo } from "react";

import type { CardTemplate, RuleAction, TagItem } from "../../../../card_story_game_types.ts";
import EditPanel from "../edit_panel.tsx";
import TemplateForm from "./template_form/template_form.tsx";

import style from "../edit_panel.module.scss";

interface TemplateEditPanelProps {
	template: CardTemplate;
	keyError: string;
	tags: TagItem[];
	actions: RuleAction[];
	onUpdateTemplate: (id: number, patch: Partial<Omit<CardTemplate, "id">>) => void;
}

export default function TemplateEditPanel({
	template,
	keyError,
	tags,
	actions,
	onUpdateTemplate,
}: TemplateEditPanelProps) {
	const templateJson = useMemo(() => JSON.stringify(template, null, 2), [template]);

	return (
		<EditPanel
			rootLabel="卡牌模板"
			currentLabel={template.key.trim() || "未命名"}
			id={template.id}
		>
			<div className={style.formCard}>
				<TemplateForm
					key={template.id}
					template={template}
					keyError={keyError}
					tags={tags}
					actions={actions}
					onUpdate={onUpdateTemplate}
				/>
			</div>

			<div className={style.preview}>
				<div className={style.previewTitle}>卡牌模板 JSON</div>
				<pre className={style.previewCode}>{templateJson}</pre>
			</div>
		</EditPanel>
	);
}
