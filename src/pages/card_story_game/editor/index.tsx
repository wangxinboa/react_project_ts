import { memo } from "react";
import { App as AntApp, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

import Editor from "./editor.tsx";
import { editorTheme } from "./editor_theme.ts";

/** 编辑器入口：只在本路由启用暗色暖金主题。 */
const EditorPage = memo(function EditorPage() {
	return (
		<ConfigProvider theme={editorTheme} locale={zhCN}>
			<AntApp component={false}>
				<Editor />
			</AntApp>
		</ConfigProvider>
	);
});

export default EditorPage;
