import { useCallback } from "react";
import { AppstoreOutlined, TagsOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Menu } from "antd";
import type { MenuProps } from "antd";

import { EditorPageKey, isEditorPageKey } from "../../utils/page_key.ts";

import style from "./editor_menu.module.scss";

interface EditorMenuProps {
	activeKey: EditorPageKey;
	onChange: (key: EditorPageKey) => void;
}

const items: MenuProps["items"] = [
	{ key: EditorPageKey.TAGS, icon: <TagsOutlined />, label: "标签" },
	{ key: EditorPageKey.ACTIONS, icon: <ThunderboltOutlined />, label: "动作" },
	{ key: EditorPageKey.TEMPLATES, icon: <AppstoreOutlined />, label: "模板" },
];

export default function EditorMenu({ activeKey, onChange }: EditorMenuProps) {
	const handleClick: MenuProps["onClick"] = useCallback(
		({ key }) => {
			if (isEditorPageKey(key)) {
				onChange(key);
			}
		},
		[onChange],
	);

	return (
		<Menu
			className={style.menu}
			mode="inline"
			theme="dark"
			items={items}
			selectedKeys={[activeKey]}
			onClick={handleClick}
		/>
	);
}
