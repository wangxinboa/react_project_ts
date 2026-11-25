import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import { EDITOR_MENU_QUERY_KEY, EditorMenuKey, EditorMenuTitle, isEditorMenuKey } from "./editor_menu_meta.ts";

/** 编辑器菜单与 URL 查询参数的双向同步。 */
export function useEditorMenu() {
	const [searchParams, setSearchParams] = useSearchParams();
	const requestedEditorMenuKey = searchParams.get(EDITOR_MENU_QUERY_KEY);
	const activeKey = isEditorMenuKey(requestedEditorMenuKey) ? requestedEditorMenuKey : EditorMenuKey.OVERVIEW;

	const handleMenuChange = useCallback(
		(key: EditorMenuKey) => {
			if (searchParams.get(EDITOR_MENU_QUERY_KEY) === key) return;

			const next = new URLSearchParams(searchParams);
			next.set(EDITOR_MENU_QUERY_KEY, key);
			setSearchParams(next);
		},
		[searchParams, setSearchParams],
	);

	return {
		activeKey,
		pageTitle: EditorMenuTitle[activeKey],
		handleMenuChange,
	};
}
