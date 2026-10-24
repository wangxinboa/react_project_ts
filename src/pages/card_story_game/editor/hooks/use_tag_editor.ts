import { useCallback, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";

import type { TagItem } from "../../card_story_game_types.ts";
import { validateTags } from "../../card_story_game_validate.ts";
import type { TagFormHandle } from "../components/edit_panel/tag_form/tag_form.tsx";

export interface TagEditorValidation {
	status: "ok" | "error";
	errorCount: number;
	warningCount: number;
}

interface UseTagEditorOptions {
	tags: TagItem[];
	/** 只更新 config.allTags，保留 allRules / cardTemplates */
	updateTags: (updater: (prev: TagItem[]) => TagItem[]) => void;
}

export interface TagEditor {
	selectedTagId: number | null;
	selectedTag: TagItem | null;
	selectedTagKeyError: string;
	validation: TagEditorValidation;
	tagFormRef: RefObject<TagFormHandle | null>;
	selectTag: (id: number) => void;
	addTag: () => void;
	updateTag: (id: number, patch: Partial<Pick<TagItem, "key" | "desc">>) => void;
	deleteTag: (id: number) => void;
	clearSelection: () => void;
}

/**
 * 标签编辑器的状态与操作：选中、增删改、语义校验、表单值同步。
 * config 仍由页面持有，这里只通过 updateTags 修改 allTags。
 */
export function useTagEditor({ tags, updateTags }: UseTagEditorOptions): TagEditor {
	const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
	const tagFormRef = useRef<TagFormHandle>(null);

	const tagValidation = useMemo(() => validateTags(tags), [tags]);

	const validation = useMemo<TagEditorValidation>(() => {
		return {
			status: tagValidation.issues.length > 0 ? "error" : "ok",
			errorCount: tagValidation.issues.length,
			warningCount: 0,
		};
	}, [tagValidation]);

	const selectedTag = useMemo(() => {
		for (let i = 0; i < tags.length; i++) {
			if (tags[i].id === selectedTagId) {
				return tags[i];
			}
		}
		return null;
	}, [tags, selectedTagId]);

	const selectedTagKeyError = useMemo(() => {
		if (selectedTagId === null) {
			return "";
		}
		return tagValidation.errorsByTagId[selectedTagId] ?? "";
	}, [tagValidation, selectedTagId]);

	// 选中标签时直接设置表单值：这是用户事件，不需要走 effect
	const applySelectedTag = useCallback((tag: TagItem) => {
		tagFormRef.current?.setValues(tag);
		setSelectedTagId(tag.id);
	}, []);

	const selectTag = useCallback(
		(id: number) => {
			for (let i = 0; i < tags.length; i++) {
				if (tags[i].id === id) {
					applySelectedTag(tags[i]);
					return;
				}
			}
		},
		[tags, applySelectedTag],
	);

	const addTag = useCallback(() => {
		let maxId = 0;
		for (let i = 0; i < tags.length; i++) {
			if (tags[i].id > maxId) {
				maxId = tags[i].id;
			}
		}

		let index = tags.length + 1;
		let newKey = `新标签${index}`;
		let duplicated = true;

		while (duplicated) {
			duplicated = false;
			for (let i = 0; i < tags.length; i++) {
				if (tags[i].key === newKey) {
					duplicated = true;
					index++;
					newKey = `新标签${index}`;
					break;
				}
			}
		}

		const newTag: TagItem = { id: maxId + 1, key: newKey, desc: "" };
		updateTags((prev) => [...prev, newTag]);
		applySelectedTag(newTag);
	}, [tags, updateTags, applySelectedTag]);

	const updateTag = useCallback(
		(id: number, patch: Partial<Pick<TagItem, "key" | "desc">>) => {
			updateTags((prev) => {
				const next: TagItem[] = [];
				for (let i = 0; i < prev.length; i++) {
					const tag = prev[i];
					next.push(tag.id === id ? { ...tag, ...patch } : tag);
				}
				return next;
			});
		},
		[updateTags],
	);

	const deleteTag = useCallback(
		(id: number) => {
			updateTags((prev) => {
				const next: TagItem[] = [];
				for (let i = 0; i < prev.length; i++) {
					if (prev[i].id !== id) {
						next.push(prev[i]);
					}
				}
				return next;
			});

			setSelectedTagId((prev) => (prev === id ? null : prev));
		},
		[updateTags],
	);

	const clearSelection = useCallback(() => {
		setSelectedTagId(null);
	}, []);

	return {
		selectedTagId,
		selectedTag,
		selectedTagKeyError,
		validation,
		tagFormRef,
		selectTag,
		addTag,
		updateTag,
		deleteTag,
		clearSelection,
	};
}
