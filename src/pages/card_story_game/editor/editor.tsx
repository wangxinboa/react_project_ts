import { useCallback, useEffect, useState } from "react";
import { App as AntApp, Splitter, Spin } from "antd";

import EditorTopBar from "./components/editor_top_bar/editor_top_bar.tsx";
import EditPanel from "./components/edit_panel/edit_panel.tsx";
import TagTree from "./components/tag_tree/tag_tree.tsx";
import { useTagEditor } from "./hooks/use_tag_editor.ts";
import type { GameConfig, TagItem } from "../card_story_game_types.ts";
import { normalizeConfig, parseConfigShape } from "../card_story_game_validate.ts";
import { serviceGetDefaultConfig } from "../../../services/card_story_game.ts";
import { downloadJSON } from "../../../utils/file_download.ts";

import style from "./editor.module.scss";

const EMPTY_CONFIG: GameConfig = {
	allTags: [],
	allRules: {},
	cardTemplates: [],
};

export default function Editor() {
	const { message, modal } = AntApp.useApp();

	const [config, setConfig] = useState<GameConfig>(EMPTY_CONFIG);
	const [isConfigLoading, setIsConfigLoading] = useState(true);
	const [configName, setConfigName] = useState("card_story_game_default_config");

	const tags = config.allTags;

	// 只更新 allTags，保留 allRules / cardTemplates
	const updateTags = useCallback((updater: (prev: TagItem[]) => TagItem[]) => {
		setConfig((prev) => ({ ...prev, allTags: updater(prev.allTags) }));
	}, []);

	const {
		selectedTag,
		selectedTagId,
		selectedTagKeyError,
		validation,
		tagFormRef,
		selectTag,
		addTag,
		updateTag,
		deleteTag,
		clearSelection,
	} = useTagEditor({ tags, updateTags });

	const handleExport = useCallback(() => {
		downloadJSON(config, configName.trim() || "game_config");
	}, [config, configName]);

	const handleImport = useCallback(
		(content: string) => {
			try {
				const data: unknown = JSON.parse(content);
				const result = parseConfigShape(data);

				if (!result.ok) {
					modal.error({
						title: "导入失败",
						content: (
							<div>
								{result.issues.map((issue) => (
									<div key={issue.path}>
										{issue.path}：{issue.message}
									</div>
								))}
							</div>
						),
					});
					return;
				}

				setConfig(normalizeConfig(result.config));
				clearSelection();

				message.success(`成功导入 ${result.config.allTags.length} 个标签`);
			} catch (err) {
				modal.error({
					title: "解析错误",
					content: err instanceof Error ? err.message : "JSON 格式有误。",
				});
			}
		},
		[message, modal, clearSelection],
	);

	// 初始化加载完整配置
	useEffect(() => {
		serviceGetDefaultConfig()
			.then((loadedConfig) => {
				setConfig(loadedConfig);
			})
			.catch((err) => {
				message.error(`加载默认配置失败: ${err.message}`);
			})
			.finally(() => {
				setIsConfigLoading(false);
			});
	}, [message]);

	return (
		<div className={style.editor}>
			{/* 顶栏 */}
			<EditorTopBar
				configName={configName}
				onConfigNameChange={setConfigName}
				onImport={handleImport}
				onExport={handleExport}
				validation={validation}
				disabled={isConfigLoading}
			/>

			{/* 主体：加载完成后才渲染编辑器 */}
			<div className={style.main}>
				{isConfigLoading ? (
					<div className={style.loading}>
						<Spin size="large" />
					</div>
				) : (
					<Splitter className={style.splitter}>
						{/* 左栏：标签树 */}
						<Splitter.Panel defaultSize={300} collapsible>
							<TagTree
								tags={tags}
								selectedTagId={selectedTagId}
								onSelectTag={selectTag}
								onAddTag={addTag}
								onDeleteTag={deleteTag}
							/>
						</Splitter.Panel>

						{/* 中间：标签编辑区 */}
						<Splitter.Panel>
							<EditPanel
								tag={selectedTag}
								keyError={selectedTagKeyError}
								tagFormRef={tagFormRef}
								onUpdateTag={updateTag}
							/>
						</Splitter.Panel>
					</Splitter>
				)}
			</div>
		</div>
	);
}
