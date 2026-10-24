import { useMemo } from "react";
import type { Ref } from "react";

import TagForm, { type TagFormHandle } from "./tag_form/tag_form.tsx";
import type { TagItem } from "../../../card_story_game_types.ts";

import style from "./edit_panel.module.scss";

interface EditPanelProps {
	/** 当前选中的标签，null 表示未选中 */
	tag: TagItem | null;
	/** 当前 key 的语义错误，由页面统一计算后传入 */
	keyError: string;
	/** 交给页面在选中标签的事件里调用 setValues */
	tagFormRef: Ref<TagFormHandle>;
	onUpdateTag: (id: number, patch: Partial<Pick<TagItem, "key" | "desc">>) => void;
}

export default function EditPanel({ tag, keyError, tagFormRef, onUpdateTag }: EditPanelProps) {
	const tagJson = useMemo(() => (tag ? JSON.stringify(tag, null, 2) : ""), [tag]);

	return (
		<section className={style.editPanel}>
			<header className={style.panelHeader}>
				<div className={style.breadcrumb}>
					<span className={style.breadcrumbRoot}>标签定义</span>
					<span className={style.breadcrumbSeparator}>/</span>
					<span className={style.breadcrumbCurrent}>{tag ? tag.key.trim() || "未命名" : "未选中"}</span>
				</div>
				{tag && <span className={style.idBadge}>ID #{tag.id}</span>}
			</header>

			{tag ? (
				<>
					<div className={style.formCard}>
						<TagForm ref={tagFormRef} tag={tag} keyError={keyError} onUpdateTag={onUpdateTag} />
					</div>

					<div className={style.preview}>
						<div className={style.previewTitle}>标签 JSON</div>
						<pre className={style.previewCode}>{tagJson}</pre>
					</div>
				</>
			) : (
				<div className={style.empty}>从左侧选择一个标签，或点击「+」新建一个</div>
			)}
		</section>
	);
}
