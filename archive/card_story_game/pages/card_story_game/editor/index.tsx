import { App as AntApp, ConfigProvider } from "antd";

import Editor from "./editor.tsx";
import { editorTheme } from "./editor_theme.ts";

export default function CardStoryGameEditorPage() {
	return (
		<ConfigProvider theme={editorTheme}>
			{/* component={false} 避免 antd 额外包一层 div，影响满屏布局 */}
			<AntApp component={false}>
				<Editor />
			</AntApp>
		</ConfigProvider>
	);
}
