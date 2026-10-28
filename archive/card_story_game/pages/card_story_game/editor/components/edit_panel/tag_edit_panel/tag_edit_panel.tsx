import { useMemo } from "react";
import type { Ref } from "react";

import type { TagItem } from "../../../../card_story_game_types.ts";
import EditPanel from "../edit_panel.tsx";
import TagForm, { type TagFormHandle } from "./tag_form/tag_form.tsx";

import style from "../edit_panel.module.scss";

interface TagEditPanelProps {
	/** 当前选中的标签 */
	tag: TagItem;
	/** 当前 key 的语义错误，由页面统一计算后传入 */
	keyError: string;
	/** 交给页面在选中标签的事件里调用 setValues */
	tagFormRef: Ref<TagFormHandle>;
	onUpdateTag: (id: number, patch: Partial<Pick<TagItem, "key" | "desc">>) => void;
}

export default function TagEditPanel({ tag, keyError, tagFormRef, onUpdateTag }: TagEditPanelProps) {
	const tagJson = useMemo(() => JSON.stringify(tag, null, 2), [tag]);

	return (
		<EditPanel rootLabel="标签定义" currentLabel={tag.key.trim() || "未命名"} id={tag.id}>
			<div className={style.formCard}>
				<TagForm ref={tagFormRef} tag={tag} keyError={keyError} onUpdateTag={onUpdateTag} />
			</div>

			<div className={style.preview}>
				<div className={style.previewTitle}>标签 JSON</div>
				<pre className={style.previewCode}>{tagJson}</pre>
			</div>
		</EditPanel>
	);
}
