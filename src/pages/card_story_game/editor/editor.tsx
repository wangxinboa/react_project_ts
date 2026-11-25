import { memo, useEffect } from "react";

import EditorHeader from "./components/editor_header.tsx";
import EditorMenu from "./components/editor_menu/editor_menu.tsx";
import { useEditorMenu } from "./components/editor_menu/use_editor_menu.ts";
import { serviceLoadEditorDefaultConfig } from "../../../services/editor_config.ts";
import style from "./editor.module.scss";

/** 编辑器基础工作区布局。 */
const Editor = memo(function Editor() {
	const { activeKey, pageTitle, handleMenuChange } = useEditorMenu();

	useEffect(() => {
		// 只在开发环境加载默认配置，避免生产构建依赖本地 public 文件。
		if (!import.meta.env.DEV) return;

		let cancelled = false;

		async function loadDefaultConfig() {
			try {
				const config = await serviceLoadEditorDefaultConfig();
				if (cancelled) return;
				console.log("[editor] 默认配置加载成功", config);
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
			<EditorHeader />

			<div className={style.body}>
				<aside className={style.sidebar}>
					<EditorMenu activeKey={activeKey} onChange={handleMenuChange} />
				</aside>

				<main className={style.content}>
					<header className={style.pageHeader}>
						<div className={style.breadcrumb}>编辑器 / {pageTitle}</div>
					</header>

					<div className={style.placeholder}>
						<div className={style.placeholderInner}>
							<div className={style.placeholderMark}>◇</div>
							<div className={style.placeholderTitle}>{pageTitle}模块尚未接入</div>
							<div className={style.placeholderDesc}>下一步先接配置工作区，再按模块补编辑表单。</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
});

export default Editor;
