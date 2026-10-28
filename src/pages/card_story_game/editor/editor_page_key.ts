export const EditorPageKey = {
	TAGS: "tags",
	ACTIONS: "actions",
	TEMPLATES: "templates",
} as const;

export type EditorPageKey = (typeof EditorPageKey)[keyof typeof EditorPageKey];

export function isEditorPageKey(value: string | null): value is EditorPageKey {
	return (
		value === EditorPageKey.TAGS ||
		value === EditorPageKey.ACTIONS ||
		value === EditorPageKey.TEMPLATES
	);
}
