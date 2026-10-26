import { useCallback, useEffect, useState } from "react";
import { App as AntApp, Splitter, Spin } from "antd";

import ActionEditPanel from "./components/edit_panel/action_edit_panel/action_edit_panel.tsx";
import EmptyEditPanel from "./components/edit_panel/empty_edit_panel.tsx";
import EditorTopBar from "./components/editor_top_bar/editor_top_bar.tsx";
import TagEditPanel from "./components/edit_panel/tag_edit_panel/tag_edit_panel.tsx";
import EditorTree from "./components/editor_tree/editor_tree.tsx";
import { useActionEditor } from "./hooks/use_action_editor.ts";
import { useTagEditor } from "./hooks/use_tag_editor.ts";
import type { GameConfig, RuleAction, TagItem } from "../card_story_game_types.ts";
import { parseConfigShape } from "../validate/index.ts";
import { serviceGetDefaultConfig } from "../../../services/card_story_game.ts";
import { downloadJSON } from "../../../utils/file_download.ts";

import style from "./editor.module.scss";

const EMPTY_CONFIG: GameConfig = {
	allTags: [],
	allRules: [],
	cardTemplates: [],
};

export default function Editor() {
	const { message, modal } = AntApp.useApp();

	const [config, setConfig] = useState<GameConfig>(EMPTY_CONFIG);
	const [isConfigLoading, setIsConfigLoading] = useState(true);
	const [configName, setConfigName] = useState("card_story_game_default_config");

	const tags = config.allTags;
	const actions = config.allRules;
	const templates = config.cardTemplates;

	// 只更新 allTags，保留 allRules / cardTemplates
	const updateTags = useCallback((updater: (prev: TagItem[]) => TagItem[]) => {
		setConfig((prev) => ({ ...prev, allTags: updater(prev.allTags) }));
	}, []);

	const updateActions = useCallback((updater: (prev: RuleAction[]) => RuleAction[]) => {
		setConfig((prev) => ({ ...prev, allRules: updater(prev.allRules) }));
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
		clearSelection: clearTagSelection,
	} = useTagEditor({ tags, updateTags });

	const {
		selectedActionId,
		selectedAction,
		selectAction,
		addAction,
		updateAction,
		deleteAction,
		clearSelection: clearActionSelection,
	} = useActionEditor({ actions, templates, updateActions });

	const handleSelectTag = useCallback(
		(id: number) => {
			clearActionSelection();
			selectTag(id);
		},
		[clearActionSelection, selectTag],
	);

	const handleAddTag = useCallback(() => {
		clearActionSelection();
		addTag();
	}, [clearActionSelection, addTag]);

	const handleSelectAction = useCallback(
		(id: number) => {
			clearTagSelection();
			selectAction(id);
		},
		[clearTagSelection, selectAction],
	);

	const handleAddAction = useCallback(() => {
		clearTagSelection();
		addAction();
	}, [clearTagSelection, addAction]);

	const handleDeleteAction = useCallback(
		(id: number) => {
			const result = deleteAction(id);
			if (!result.blocked) {
				return;
			}

			modal.warning({
				title: "无法删除动作",
				content: (
					<div>
						<div>该动作正被以下模板引用：</div>
						{result.references.map((ref, index) => (
							<div key={`${ref.templateId}-${ref.group}-${index}`}>
								{ref.templateKey} / {ref.group}
							</div>
						))}
					</div>
				),
			});
		},
		[deleteAction, modal],
	);

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

				setConfig(result.config);
				clearTagSelection();
				clearActionSelection();

				message.success(`成功导入 ${result.config.allTags.length} 个标签、${result.config.allRules.length} 个动作`);
			} catch (err) {
				modal.error({
					title: "解析错误",
					content: err instanceof Error ? err.message : "JSON 格式有误。",
				});
			}
		},
		[message, modal, clearTagSelection, clearActionSelection],
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
						{/* 左栏：标签 + 动作 */}
						<Splitter.Panel defaultSize={300} collapsible>
							<EditorTree
								tags={tags}
								actions={actions}
								selectedTagId={selectedTagId}
								selectedActionId={selectedActionId}
								onSelectTag={handleSelectTag}
								onAddTag={handleAddTag}
								onDeleteTag={deleteTag}
								onSelectAction={handleSelectAction}
								onAddAction={handleAddAction}
								onDeleteAction={handleDeleteAction}
							/>
						</Splitter.Panel>

						{/* 中间：标签 / 动作编辑区 */}
						<Splitter.Panel>
							{selectedAction ? (
								<ActionEditPanel action={selectedAction} onUpdateAction={updateAction} />
							) : selectedTag ? (
								<TagEditPanel
									tag={selectedTag}
									keyError={selectedTagKeyError}
									tagFormRef={tagFormRef}
									onUpdateTag={updateTag}
								/>
							) : (
								<EmptyEditPanel />
							)}
						</Splitter.Panel>
					</Splitter>
				)}
			</div>
		</div>
	);
}
