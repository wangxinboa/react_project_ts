import { useCallback, useMemo, useState } from "react";

import type { CardTemplate, RuleAction, TagItem } from "../../card_story_game_types.ts";
import { validateTemplates, type ValidationIssue } from "../../validate/index.ts";

interface UseTemplateEditorOptions {
	templates: CardTemplate[];
	tags: TagItem[];
	actions: RuleAction[];
	/** 只更新 config.cardTemplates，保留 allTags / allRules */
	updateTemplates: (updater: (prev: CardTemplate[]) => CardTemplate[]) => void;
}

export interface TemplateEditorValidation {
	status: "ok" | "error";
	errorCount: number;
	warningCount: number;
	issues: ValidationIssue[];
}

export interface TemplateEditor {
	selectedTemplateId: number | null;
	selectedTemplate: CardTemplate | null;
	selectedTemplateKeyError: string;
	validation: TemplateEditorValidation;
	selectTemplate: (id: number) => void;
	updateTemplate: (id: number, patch: Partial<Omit<CardTemplate, "id">>) => void;
	addTemplate: () => void;
	deleteTemplate: (id: number) => void;
	clearSelection: () => void;
}

/**
 * 模板编辑器的选中、新增、删除。
 * 模板 id 全局唯一，新增时取当前最大值 + 1。
 */
export function useTemplateEditor({
	templates,
	tags,
	actions,
	updateTemplates,
}: UseTemplateEditorOptions): TemplateEditor {
	const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

	const selectedTemplate = useMemo(() => {
		for (let i = 0; i < templates.length; i++) {
			if (templates[i].id === selectedTemplateId) {
				return templates[i];
			}
		}
		return null;
	}, [templates, selectedTemplateId]);

	const templateValidation = useMemo(() => validateTemplates(templates, tags, actions), [templates, tags, actions]);

	const validation = useMemo<TemplateEditorValidation>(() => {
		return {
			status: templateValidation.issues.length > 0 ? "error" : "ok",
			errorCount: templateValidation.issues.length,
			warningCount: 0,
			issues: templateValidation.issues,
		};
	}, [templateValidation]);

	const selectedTemplateKeyError = useMemo(() => {
		if (selectedTemplateId === null) {
			return "";
		}
		return templateValidation.errorsByTemplateId[selectedTemplateId] ?? "";
	}, [templateValidation, selectedTemplateId]);

	const selectTemplate = useCallback((id: number) => {
		setSelectedTemplateId(id);
	}, []);

	const updateTemplate = useCallback(
		(id: number, patch: Partial<Omit<CardTemplate, "id">>) => {
			updateTemplates((prev) => {
				const next: CardTemplate[] = [];
				for (let i = 0; i < prev.length; i++) {
					const template = prev[i];
					next.push(template.id === id ? { ...template, ...patch } : template);
				}
				return next;
			});
		},
		[updateTemplates],
	);

	const addTemplate = useCallback(() => {
		let maxId = 0;
		for (let i = 0; i < templates.length; i++) {
			if (templates[i].id > maxId) {
				maxId = templates[i].id;
			}
		}

		let index = templates.length + 1;
		let key = `新模板${index}`;
		while (templates.some((template) => template.key === key)) {
			index++;
			key = `新模板${index}`;
		}

		const newTemplate: CardTemplate = {
			id: maxId + 1,
			key,
			tags: [],
			attributes: [],
			auto: [],
			outgoing: [],
			incoming: [],
		};

		updateTemplates((prev) => [...prev, newTemplate]);
		setSelectedTemplateId(newTemplate.id);
	}, [templates, updateTemplates]);

	const deleteTemplate = useCallback(
		(id: number) => {
			updateTemplates((prev) => {
				const next: CardTemplate[] = [];
				for (let i = 0; i < prev.length; i++) {
					if (prev[i].id !== id) {
						next.push(prev[i]);
					}
				}
				return next;
			});
			setSelectedTemplateId((prev) => (prev === id ? null : prev));
		},
		[updateTemplates],
	);

	const clearSelection = useCallback(() => {
		setSelectedTemplateId(null);
	}, []);

	return {
		selectedTemplateId,
		selectedTemplate,
		selectedTemplateKeyError,
		validation,
		selectTemplate,
		updateTemplate,
		addTemplate,
		deleteTemplate,
		clearSelection,
	};
}
