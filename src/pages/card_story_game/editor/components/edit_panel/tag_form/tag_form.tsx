import { useCallback } from "react";
import { Form, Input } from "antd";

import type { TagItem } from "../../../../card_story_game_types.ts";
import { getTagKeyError } from "../../../../card_story_game_validate.ts";
import { isString } from "../../../../../../utils/type_guard.ts";

import style from "./tag_form.module.scss";

type TagFormValues = Pick<TagItem, "key" | "desc">;

interface TagFormProps {
	tag: TagItem;
	/** 全部标签，用于 key 查重 */
	tags: TagItem[];
	onUpdateTag: (id: number, patch: Partial<TagFormValues>) => void;
}

export default function TagForm({ tag, tags, onUpdateTag }: TagFormProps) {
	const [form] = Form.useForm<TagFormValues>();

	// key 只要求展示上唯一：改名时立刻给出提示，但不阻塞输入
	const keyError = getTagKeyError(tag, tags) ?? "";

	// Form 只持有输入态，tags 仍是模型：每次变更立即同步回去
	const handleValuesChange = useCallback(
		(_changedValues: Partial<TagFormValues>, values: TagFormValues) => {
			onUpdateTag(tag.id, { key: values.key, desc: values.desc });
		},
		[onUpdateTag, tag.id],
	);

	// 失焦时去掉首尾空白，避免出现看起来一样的重复 key
	const handleKeyBlur = useCallback(() => {
		const current = form.getFieldValue("key");
		if (!isString(current)) {
			return;
		}

		const trimmed = current.trim();
		if (trimmed !== current) {
			form.setFieldValue("key", trimmed);
			onUpdateTag(tag.id, { key: trimmed });
		}
	}, [form, onUpdateTag, tag.id]);

	// 说明和错误共用 help 槽位：出错时只换文字，explain 行高度不变
	const keyExtra = keyError ? (
		<span className={style.fieldError}>{keyError}</span>
	) : (
		`可随时重命名；规则与卡牌模板通过 ID #${tag.id} 引用它，不依赖 key。`
	);

	return (
		<Form<TagFormValues>
			form={form}
			className={style.tagForm}
			layout="vertical"
			colon={false}
			initialValues={{ key: tag.key, desc: tag.desc }}
			onValuesChange={handleValuesChange}
		>
			<Form.Item label="标签 key" name="key" validateStatus={keyError ? "error" : undefined} help={keyExtra}>
				<Input
					placeholder="例如：活体"
					spellCheck={false}
					autoComplete="off"
					aria-invalid={Boolean(keyError)}
					onBlur={handleKeyBlur}
				/>
			</Form.Item>

			<Form.Item label="描述" name="desc" extra="纯文本，可以为空。">
				<Input.TextArea placeholder="这个标签代表什么？" rows={6} spellCheck={false} />
			</Form.Item>
		</Form>
	);
}
