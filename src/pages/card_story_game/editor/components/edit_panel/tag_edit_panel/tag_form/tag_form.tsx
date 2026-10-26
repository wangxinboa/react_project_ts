import { forwardRef, useCallback, useImperativeHandle, useMemo } from "react";
import { Form, Input } from "antd";

import type { TagItem } from "../../../../../card_story_game_types.ts";
import { isString } from "../../../../../../../utils/type_guard.ts";

import style from "./tag_form.module.scss";

export interface TagFormHandle {
	/** 由父组件在选中标签的事件里调用；不要用 effect 回填表单值 */
	setValues: (tag: TagItem) => void;
}

type TagFormValues = Pick<TagItem, "key" | "desc">;

interface TagFormProps {
	tag: TagItem;
	/** 当前 key 的语义错误，由上层统一计算后传入 */
	keyError: string;
	onUpdateTag: (id: number, patch: Partial<TagFormValues>) => void;
}

const TagForm = forwardRef<TagFormHandle, TagFormProps>(function TagForm({ tag, keyError, onUpdateTag }, ref) {
	const [form] = Form.useForm<TagFormValues>();

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
	const keyExtra = useMemo(() => {
		if (keyError) {
			return <span className={style.fieldError}>{keyError}</span>;
		}
		return `可随时重命名；规则与卡牌模板通过 ID #${tag.id} 引用它，不依赖 key。`;
	}, [keyError, tag.id]);

	// 父组件切换标签时主动调用 setValues；initialValues 只在首次挂载时生效
	useImperativeHandle(
		ref,
		() => ({
			setValues(nextTag: TagItem) {
				form.setFieldsValue({ key: nextTag.key, desc: nextTag.desc });
			},
		}),
		[form],
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
});

export default TagForm;
