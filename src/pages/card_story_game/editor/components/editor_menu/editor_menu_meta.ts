import { registerSearchParamKey } from "../../../../../utils/search_params.ts";

/** 编辑器左侧菜单 key。 */
export const EditorMenuKey = {
	ATTRIBUTES: "attributes",
	TAGS: "tags",
	TEMPLATES: "templates",
	ACTIONS: "actions",
	EFFECTS: "effects",
	DIALOGUES: "dialogues",
	AGREEMENTS: "agreements",
} as const;

export type EditorMenuKey = (typeof EditorMenuKey)[keyof typeof EditorMenuKey];

/** 编辑器菜单在 URL 查询参数中的键名。 */
export const EDITOR_MENU_QUERY_KEY = "editorMenuKey";

registerSearchParamKey(EDITOR_MENU_QUERY_KEY);

/** 菜单和页面共用的标题。 */
export const EditorMenuTitle: Record<EditorMenuKey, string> = {
	[EditorMenuKey.ATTRIBUTES]: "属性",
	[EditorMenuKey.TAGS]: "标签",
	[EditorMenuKey.TEMPLATES]: "卡牌模板",
	[EditorMenuKey.ACTIONS]: "动作",
	[EditorMenuKey.EFFECTS]: "效果",
	[EditorMenuKey.DIALOGUES]: "对话",
	[EditorMenuKey.AGREEMENTS]: "共识",
};

const EDITOR_MENU_KEY_SET = new Set<string>(Object.values(EditorMenuKey));

export function isEditorMenuKey(value: string | null): value is EditorMenuKey {
	return value !== null && EDITOR_MENU_KEY_SET.has(value);
}
