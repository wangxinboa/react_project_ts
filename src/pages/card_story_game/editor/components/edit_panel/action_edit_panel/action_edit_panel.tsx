import { useMemo } from "react";

import type { RuleAction } from "../../../../card_story_game_types.ts";
import EditPanel from "../edit_panel.tsx";
import ActionForm from "./action_form/action_form.tsx";

import style from "../edit_panel.module.scss";

interface ActionEditPanelProps {
	action: RuleAction;
	onUpdateAction: (id: number, patch: Partial<Omit<RuleAction, "id">>) => void;
}

export default function ActionEditPanel({ action, onUpdateAction }: ActionEditPanelProps) {
	const actionJson = useMemo(() => JSON.stringify(action, null, 2), [action]);

	return (
		<EditPanel rootLabel="动作定义" currentLabel={action.verb.trim() || "未命名"} id={action.id}>
			<div className={style.formCard}>
				<ActionForm key={action.id} action={action} onUpdate={onUpdateAction} />
			</div>

			<div className={style.preview}>
				<div className={style.previewTitle}>动作 JSON</div>
				<pre className={style.previewCode}>{actionJson}</pre>
			</div>
		</EditPanel>
	);
}
