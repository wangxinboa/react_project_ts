import { useCallback, useMemo, useState } from "react";

import type { CardTemplate, RuleAction } from "../../card_story_game_types.ts";

export type ActionTriggerGroup = "auto" | "outgoing" | "incoming";

export interface ActionReference {
	templateId: number;
	templateKey: string;
	group: ActionTriggerGroup;
}

interface UseActionEditorOptions {
	actions: RuleAction[];
	templates: CardTemplate[];
	/** 只更新 config.allRules，保留 allTags / cardTemplates */
	updateActions: (updater: (prev: RuleAction[]) => RuleAction[]) => void;
}

export interface DeleteActionResult {
	blocked: boolean;
	references: ActionReference[];
}

export interface ActionEditor {
	selectedActionId: number | null;
	selectedAction: RuleAction | null;
	selectAction: (id: number) => void;
	addAction: () => void;
	updateAction: (id: number, patch: Partial<Omit<RuleAction, "id">>) => void;
	deleteAction: (id: number) => DeleteActionResult;
	clearSelection: () => void;
}

/**
 * 动作库的选中、增删改，以及“动作被哪些模板引用”的索引。
 * 动作 id 全局唯一，新增时取当前最大值 + 1。
 */
export function useActionEditor({ actions, templates, updateActions }: UseActionEditorOptions): ActionEditor {
	const [selectedActionId, setSelectedActionId] = useState<number | null>(null);

	const referencesByActionId = useMemo(() => {
		const references: Record<number, ActionReference[]> = {};

		for (let i = 0; i < templates.length; i++) {
			const template = templates[i];
			const groups: Array<{ group: ActionTriggerGroup; ids: number[] }> = [
				{ group: "auto", ids: template.auto },
				{ group: "outgoing", ids: template.outgoing },
				{ group: "incoming", ids: template.incoming },
			];

			for (let g = 0; g < groups.length; g++) {
				const { group, ids } = groups[g];
				for (let r = 0; r < ids.length; r++) {
					const actionId = ids[r];
					const list = references[actionId];
					const reference: ActionReference = {
						templateId: template.id,
						templateKey: template.key,
						group,
					};
					if (list) {
						list.push(reference);
					} else {
						references[actionId] = [reference];
					}
				}
			}
		}

		return references;
	}, [templates]);

	const selectedAction = useMemo(() => {
		for (let i = 0; i < actions.length; i++) {
			if (actions[i].id === selectedActionId) {
				return actions[i];
			}
		}
		return null;
	}, [actions, selectedActionId]);

	const selectAction = useCallback((id: number) => {
		setSelectedActionId(id);
	}, []);

	const addAction = useCallback(() => {
		let maxId = 0;
		for (let i = 0; i < actions.length; i++) {
			if (actions[i].id > maxId) {
				maxId = actions[i].id;
			}
		}

		const newAction: RuleAction = {
			id: maxId + 1,
			verb: "new_action",
			params: [],
			targets: [],
			conditions: [],
			effects: [],
		};

		updateActions((prev) => [...prev, newAction]);
		setSelectedActionId(newAction.id);
	}, [actions, updateActions]);

	const updateAction = useCallback(
		(id: number, patch: Partial<Omit<RuleAction, "id">>) => {
			updateActions((prev) => {
				const next: RuleAction[] = [];
				for (let i = 0; i < prev.length; i++) {
					const action = prev[i];
					next.push(action.id === id ? { ...action, ...patch } : action);
				}
				return next;
			});
		},
		[updateActions],
	);

	const deleteAction = useCallback(
		(id: number): DeleteActionResult => {
			const references = referencesByActionId[id] ?? [];
			if (references.length > 0) {
				return { blocked: true, references };
			}

			updateActions((prev) => {
				const next: RuleAction[] = [];
				for (let i = 0; i < prev.length; i++) {
					if (prev[i].id !== id) {
						next.push(prev[i]);
					}
				}
				return next;
			});
			setSelectedActionId((prev) => (prev === id ? null : prev));

			return { blocked: false, references: [] };
		},
		[referencesByActionId, updateActions],
	);

	const clearSelection = useCallback(() => {
		setSelectedActionId(null);
	}, []);

	return {
		selectedActionId,
		selectedAction,
		selectAction,
		addAction,
		updateAction,
		deleteAction,
		clearSelection,
	};
}
