import { App as AntApp, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

import Editor from "./editor.tsx";
import { editorTheme } from "./editor_theme.ts";

export default function EditorPage() {
	return (
		<ConfigProvider theme={editorTheme} locale={zhCN}>
			<AntApp component={false}>
				<Editor />
			</AntApp>
		</ConfigProvider>
	);
}
