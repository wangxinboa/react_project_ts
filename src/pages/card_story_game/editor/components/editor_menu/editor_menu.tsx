import { memo, useCallback } from "react";
import {
	AppstoreOutlined,
	BookOutlined,
	CommentOutlined,
	DashboardOutlined,
	FileTextOutlined,
	FormOutlined,
	TagsOutlined,
	ThunderboltOutlined,
} from "@ant-design/icons";
import { Menu } from "antd";
import type { MenuProps } from "antd";

import { EditorMenuKey, EditorMenuTitle, isEditorMenuKey } from "./editor_menu_meta.ts";
import style from "./editor_menu.module.scss";

interface EditorMenuProps {
	activeKey: EditorMenuKey;
	onChange: (key: EditorMenuKey) => void;
}

const items: MenuProps["items"] = [
	{ key: EditorMenuKey.OVERVIEW, icon: <DashboardOutlined />, label: EditorMenuTitle[EditorMenuKey.OVERVIEW] },
	{ key: EditorMenuKey.ATTRIBUTES, icon: <FormOutlined />, label: EditorMenuTitle[EditorMenuKey.ATTRIBUTES] },
	{ key: EditorMenuKey.TAGS, icon: <TagsOutlined />, label: EditorMenuTitle[EditorMenuKey.TAGS] },
	{ key: EditorMenuKey.TEMPLATES, icon: <AppstoreOutlined />, label: EditorMenuTitle[EditorMenuKey.TEMPLATES] },
	{ key: EditorMenuKey.ACTIONS, icon: <ThunderboltOutlined />, label: EditorMenuTitle[EditorMenuKey.ACTIONS] },
	{ key: EditorMenuKey.EFFECTS, icon: <BookOutlined />, label: EditorMenuTitle[EditorMenuKey.EFFECTS] },
	{ key: EditorMenuKey.DIALOGUES, icon: <CommentOutlined />, label: EditorMenuTitle[EditorMenuKey.DIALOGUES] },
	{ key: EditorMenuKey.AGREEMENTS, icon: <FileTextOutlined />, label: EditorMenuTitle[EditorMenuKey.AGREEMENTS] },
];

/** 编辑器左侧一级菜单。 */
const EditorMenu = memo(function EditorMenu({ activeKey, onChange }: EditorMenuProps) {
	const handleClick: MenuProps["onClick"] = useCallback(
		({ key }) => {
			if (isEditorMenuKey(key)) onChange(key);
		},
		[onChange],
	);

	return (
		<nav className={style.menuWrapper}>
			<Menu
				className={style.menu}
				mode="inline"
				theme="dark"
				items={items}
				selectedKeys={[activeKey]}
				onClick={handleClick}
			/>
		</nav>
	);
});

export default EditorMenu;
