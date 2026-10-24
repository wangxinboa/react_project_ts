import { useCallback, useEffect, useMemo, useState } from "react";
import { App as AntApp, Splitter, Spin } from "antd";
import { CaretDownOutlined, CaretRightOutlined } from "@ant-design/icons";

import EditorTopBar, { type EditorValidationState } from "./components/editor_top_bar/editor_top_bar.tsx";
import EditPanel from "./components/edit_panel/edit_panel.tsx";
import type { TagItem } from "../card_story_game_types.ts";
import { normalizeTags, parseConfigShape, validateTags } from "../card_story_game_validate.ts";
import { serviceGetDefaultConfig } from "../../../services/card_story_game.ts";
import { downloadJSON } from "../../../utils/file_download.ts";

import style from "./editor.module.scss";

export default function Editor() {
	const { message, modal } = AntApp.useApp();

	const [tags, setTags] = useState<TagItem[]>([]);
	// 选中态以 id 为准：key 可以随时改名，id 不会变
	const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
	const [tagGroupExpanded, setTagGroupExpanded] = useState(true);
	const [isLoading, setIsLoading] = useState(true);

	const [configName, setConfigName] = useState("game_config");

	// 目前只有标签，先做标签层的语义校验：key 不能为空、不能重名。
	// 规则 / 模板的结构与引用校验，等它们落地后再补。
	const validation = useMemo<EditorValidationState>(() => {
		const issues = validateTags(tags);

		return {
			status: issues.length > 0 ? "error" : "ok",
			errorCount: issues.length,
			warningCount: 0,
		};
	}, [tags]);

	const selectedTag = useMemo(() => {
		for (let i = 0; i < tags.length; i++) {
			if (tags[i].id === selectedTagId) {
				return tags[i];
			}
		}
		return null;
	}, [tags, selectedTagId]);

	const handleExport = useCallback(() => {
		// 1. 组装数据
		const exportData = {
			allTags: tags,
			allRules: {},
			cardTemplates: [],
		};
		// 2. 调用工具方法下载
		downloadJSON(exportData, configName.trim() || "game_config");
	}, [tags, configName]);

	const handleImport = useCallback((content: string) => {
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

			setTags(normalizeTags(result.allTags));
			setSelectedTagId(null);

			message.success(`成功导入 ${result.allTags.length} 个标签`);
		} catch (err) {
			modal.error({
				title: "解析错误",
				content: err instanceof Error ? err.message : "JSON 格式有误。",
			});
		}
	}, [message, modal]);

	// ============================================================
	// 2. 树操作逻辑
	// ============================================================
	const handleToggleTagGroup = useCallback(() => {
		setTagGroupExpanded((v) => !v);
	}, []);

	const handleAddTag = useCallback(() => {
		let maxId = 0;
		for (let i = 0; i < tags.length; i++) {
			if (tags[i].id > maxId) {
				maxId = tags[i].id;
			}
		}

		let index = tags.length + 1;
		let newKey = `新标签${index}`;
		let duplicated = true;

		while (duplicated) {
			duplicated = false;
			for (let i = 0; i < tags.length; i++) {
				if (tags[i].key === newKey) {
					duplicated = true;
					index++;
					newKey = `新标签${index}`;
					break;
				}
			}
		}

		setTags((prev) => [...prev, { id: maxId + 1, key: newKey, desc: "" }]);
		setSelectedTagId(maxId + 1);
		setTagGroupExpanded(true);
	}, [tags]);

	const handleDeleteTag = useCallback((e: React.MouseEvent, id: number) => {
		e.stopPropagation();

		setTags((prev) => {
			const next: TagItem[] = [];
			for (let i = 0; i < prev.length; i++) {
				if (prev[i].id !== id) {
					next.push(prev[i]);
				}
			}
			return next;
		});

		setSelectedTagId((prev) => (prev === id ? null : prev));
	}, []);

	const handleSelectTag = useCallback((id: number) => {
		setSelectedTagId(id);
	}, []);

	const handleUpdateTag = useCallback((id: number, patch: Partial<Pick<TagItem, "key" | "desc">>) => {
		setTags((prev) => {
			const next: TagItem[] = [];
			for (let i = 0; i < prev.length; i++) {
				const tag = prev[i];
				next.push(tag.id === id ? { ...tag, ...patch } : tag);
			}
			return next;
		});
	}, []);

	// 初始化加载
	useEffect(() => {
		serviceGetDefaultConfig()
			.then((loadedTags) => {
				setTags(loadedTags);
			})
			.catch((err) => {
				message.error(`加载默认配置失败: ${err.message}`);
			})
			.finally(() => {
				setIsLoading(false);
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
			/>

			{/* 主体三栏 */}
			<div className={style.main}>
				<Splitter className={style.splitter}>
					{/* 左栏：结构树 */}
					<Splitter.Panel defaultSize={300} collapsible>
						<div className={style.leftPanel}>
							<div className={style.treeGroup}>
								<div className={style.treeGroupHeader}>
									<button
										className={style.treeGroupToggle}
										onClick={handleToggleTagGroup}
										title={tagGroupExpanded ? "收起" : "展开"}
									>
										{tagGroupExpanded ? (
											<CaretDownOutlined className={style.treeGroupArrow} />
										) : (
											<CaretRightOutlined className={style.treeGroupArrow} />
										)}
										<span className={style.treeGroupTitle}>标签定义</span>
										<span className={style.treeGroupCount}>{tags.length}</span>
									</button>
									<button className={style.treeGroupAdd} title="添加标签" onClick={handleAddTag}>
										+
									</button>
								</div>

								{tagGroupExpanded && (
									<div className={style.treeItems}>
										{isLoading ? (
											<div style={{ padding: "0.1rem", textAlign: "center" }}>
												<Spin size="small" />
											</div>
										) : (
											<>
												{tags.map((tag) => (
													<div
														key={tag.id}
														className={`${style.treeItem} ${selectedTagId === tag.id ? style.treeItemActive : ""}`}
														onClick={() => handleSelectTag(tag.id)}
													>
														<span className={style.treeItemLabel}>{tag.key.trim() || "未命名"}</span>
														<button
															className={style.treeItemDelete}
															title="删除"
															onClick={(e) => handleDeleteTag(e, tag.id)}
														>
															×
														</button>
													</div>
												))}
												{tags.length === 0 && !isLoading && <div className={style.treeEmpty}>暂无标签</div>}
											</>
										)}
									</div>
								)}
							</div>
						</div>
					</Splitter.Panel>

					{/* 中间：标签编辑区 */}
					<Splitter.Panel>
						<EditPanel tag={selectedTag} tags={tags} onUpdateTag={handleUpdateTag} />
					</Splitter.Panel>

					{/* 右侧：预览 / 校验（占位） */}
					<Splitter.Panel defaultSize={300} collapsible>
						<div className={style.rightPanel}>
							<div className={style.placeholder}>预览 / 校验（待实现）</div>
						</div>
					</Splitter.Panel>
				</Splitter>
			</div>
		</div>
	);
}
