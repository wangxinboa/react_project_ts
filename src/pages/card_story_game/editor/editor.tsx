import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Spin } from "antd";

import type { GameConfig, TagItem } from "../card_story_game_types.ts";
import { validateTags } from "../validate/tags.ts";
import { serviceGetCardStoryGameConfig } from "../../../services/card_story_game.ts";
import EditorMenu from "./components/editor_menu/editor_menu.tsx";
import EditorTopBar from "./components/editor_top_bar/editor_top_bar.tsx";
import { EditorPageKey, isEditorPageKey } from "./editor_page_key.ts";
import TagPage from "./sections/tag_page/tag_page.tsx";

import style from "./editor.module.scss";

const PAGE_TITLES: Record<EditorPageKey, string> = {
	[EditorPageKey.TAGS]: "标签定义",
	[EditorPageKey.ACTIONS]: "动作规则",
	[EditorPageKey.TEMPLATES]: "卡牌模板",
};

export default function Editor() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [configName, setConfigName] = useState("card_story_game_default_config");
	const [config, setConfig] = useState<GameConfig | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState("");

	const requestedPage = searchParams.get("page");
	const activePage: EditorPageKey = useMemo(() => {
		return isEditorPageKey(requestedPage) ? requestedPage : EditorPageKey.TAGS;
	}, [requestedPage]);
	const pageTitle = PAGE_TITLES[activePage];
	const tagValidation = useMemo(() => validateTags(config?.allTags ?? []), [config]);

	useEffect(() => {
		let cancelled = false;

		async function loadConfig() {
			try {
				const loaded = await serviceGetCardStoryGameConfig();
				if (!cancelled) {
					setConfig(loaded);
					setLoadError("");
				}
			} catch (error) {
				if (!cancelled) {
					setLoadError(error instanceof Error ? error.message : "配置加载失败");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		void loadConfig();
		return () => {
			cancelled = true;
		};
	}, []);

	const handleTagsChange = useCallback((updater: (prev: TagItem[]) => TagItem[]) => {
		setConfig((prev) => {
			if (!prev) {
				return prev;
			}
			return { ...prev, allTags: updater(prev.allTags) };
		});
	}, []);

	const handlePageChange = useCallback(
		(key: EditorPageKey) => {
			if (searchParams.get("page") === key) {
				return;
			}

			const next = new URLSearchParams(searchParams);
			next.set("page", key);
			setSearchParams(next);
		},
		[searchParams, setSearchParams],
	);

	return (
		<div className={style.editor}>
			<EditorTopBar
				configName={configName}
				onConfigNameChange={setConfigName}
				validationStatus={tagValidation.issues.length > 0 ? "error" : "ok"}
			/>

			<div className={style.body}>
				<aside className={style.sidebar}>
					<EditorMenu activeKey={activePage} onChange={handlePageChange} />
				</aside>

				<main className={style.content}>
					<header className={style.pageHeader}>
						<div className={style.breadcrumb}>编辑器 / {pageTitle}</div>
					</header>

					{loading ? (
						<div className={style.state}>
							<Spin />
						</div>
					) : loadError ? (
						<div className={style.state}>
							<Alert
								className={style.loadError}
								type="error"
								showIcon
								message="配置加载失败"
								description={loadError}
							/>
						</div>
					) : activePage === EditorPageKey.TAGS && config ? (
						<TagPage tags={config.allTags} onTagsChange={handleTagsChange} />
					) : null}
				</main>
			</div>
		</div>
	);
}
