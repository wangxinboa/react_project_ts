import { memo, useCallback, useEffect, useState } from "react";

import EditorHeader from "./components/editor_header.tsx";
import EditorMenu from "./components/editor_menu/editor_menu.tsx";
import { useEditorMenu } from "./components/editor_menu/use_editor_menu.ts";
import type { AttributeDefinition, GameConfig } from "../card_story_game_types/index.ts";
import EditorSection from "./sections/editor_section.tsx";
import { serviceLoadEditorDefaultConfig } from "../../../services/editor_config.ts";
import { downloadJSON } from "../../../utils/file_download.ts";
import style from "./editor.module.scss";

/** 编辑器基础工作区布局。 */
const Editor = memo(function Editor() {
	const { activeKey, pageTitle, handleMenuChange } = useEditorMenu();
	const [config, setConfig] = useState<GameConfig | null>(null);

	const handleAttributesChange = useCallback(
		(updater: (prev: AttributeDefinition[]) => AttributeDefinition[]) => {
			setConfig((prev) => (prev ? { ...prev, allAttributes: updater(prev.allAttributes) } : prev));
		},
		[],
	);

	const handleExportAttributes = useCallback(() => {
		if (!config) return;
		downloadJSON({ allAttributes: config.allAttributes }, "card_story_game_attributes");
	}, [config]);

	useEffect(() => {
		// 只在开发环境加载默认配置，避免生产构建依赖本地 public 文件。
		if (!import.meta.env.DEV) return;

		let cancelled = false;

		async function loadDefaultConfig() {
			try {
				const loadedConfig = await serviceLoadEditorDefaultConfig();
				if (cancelled) return;
				setConfig(loadedConfig);
				console.log("[editor] 默认配置加载成功", loadedConfig);
			} catch (error) {
				console.error("[editor] 默认配置加载失败", error);
			}
		}

		void loadDefaultConfig();

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div className={style.editor}>
			<EditorHeader canExport={config !== null} onExport={handleExportAttributes} />

			<div className={style.body}>
				<aside className={style.sidebar}>
					<EditorMenu activeKey={activeKey} onChange={handleMenuChange} />
				</aside>

				<main className={style.content}>
					<header className={style.pageHeader}>
						<div className={style.breadcrumb}>编辑器 / {pageTitle}</div>
					</header>

					<EditorSection
						activeKey={activeKey}
						pageTitle={pageTitle}
						config={config}
						onAttributesChange={handleAttributesChange}
					/>
				</main>
			</div>
		</div>
	);
});

export default Editor;
