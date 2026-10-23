import { useCallback, useEffect, useState } from "react";
import { Splitter, Spin, message, Modal } from "antd";
import { CaretDownOutlined, CaretRightOutlined } from "@ant-design/icons";

import EditorTopBar, { type EditorValidationState } from "./components/editor_top_bar/editor_top_bar.tsx";
import type { TagItem } from "../card_story_game_types.ts";
import { serviceGetDefaultConfig } from "../../../services/card_story_game.ts";
import { downloadJSON } from "../../../utils/file_download.ts";

import style from "./editor.module.scss";

export default function Editor() {
	const [tags, setTags] = useState<TagItem[]>([]);
	const [selectedTag, setSelectedTag] = useState<string | null>(null);
	const [tagGroupExpanded, setTagGroupExpanded] = useState(true);
	const [isLoading, setIsLoading] = useState(true);

	const [configName, setConfigName] = useState("game_config");
	const [validation] = useState<EditorValidationState>({
		status: "ok",
		errorCount: 0,
		warningCount: 0,
	});

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
			const data = JSON.parse(content);

			if (!data || typeof data !== "object" || !Array.isArray(data.allTags)) {
				Modal.error({
					title: "导入失败",
					content: "文件格式不正确，根节点的 allTags 必须是数组。",
				});
				return;
			}

			setTags(data.allTags);
			setSelectedTag(null);

			message.success("成功导入");
		} catch (err) {
			Modal.error({
				title: "解析错误",
				content: err instanceof Error ? err.message : "JSON 格式有误。",
			});
		}
	}, []);

	// ============================================================
	// 2. 树操作逻辑
	// ============================================================
	const handleToggleTagGroup = useCallback(() => {
		setTagGroupExpanded((v) => !v);
	}, []);

	const handleAddTag = useCallback(() => {
		let idx = tags.length + 1;
		let newKey = `新标签${idx}`;
		// 检查 key 是否重复
		const existed = new Set(tags.map((t) => t.key));
		while (existed.has(newKey)) {
			idx++;
			newKey = `新标签${idx}`;
		}
		setTags((prev) => [...prev, { key: newKey, desc: "" }]);
		setSelectedTag(newKey);
		setTagGroupExpanded(true);
	}, [tags]);

	const handleDeleteTag = useCallback((e: React.MouseEvent, key: string) => {
		e.stopPropagation();
		setTags((prev) => prev.filter((t) => t.key !== key));
		setSelectedTag((prev) => (prev === key ? null : prev));
	}, []);

	const handleSelectTag = useCallback((key: string) => {
		setSelectedTag(key);
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
	}, []);

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
														// 注意：这里把 key 和比较判断由原来的 tag.name 改成了 tag.key
														key={tag.key}
														className={`${style.treeItem} ${selectedTag === tag.key ? style.treeItemActive : ""}`}
														onClick={() => handleSelectTag(tag.key)}
													>
														<span className={style.treeItemLabel}>{tag.key}</span>
														<button
															className={style.treeItemDelete}
															title="删除"
															onClick={(e) => handleDeleteTag(e, tag.key)}
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

					{/* 中间：编辑区（占位） */}
					<Splitter.Panel>
						<div className={style.centerPanel}>
							<div className={style.placeholder}>
								{selectedTag ? `编辑区 · 当前选中「${selectedTag}」` : "编辑区 · 请选择左侧节点"}
							</div>
						</div>
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
