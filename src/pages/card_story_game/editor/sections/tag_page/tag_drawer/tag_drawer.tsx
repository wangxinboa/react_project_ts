import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from "react";
import { Button, Drawer, Form, Input } from "antd";

import type { TagItem } from "../../../../card_story_game_types.ts";
import { FormMode } from "../../../../../../utils/form_mode.ts";

import style from "./tag_drawer.module.scss";

interface TagFormValues {
	key: string;
	desc: string;
}

type TagFormResult = Pick<TagItem, "key" | "desc">;

export interface TagDrawerHandle {
	create: () => void;
	edit: (tag: TagItem) => void;
	close: () => void;
}

interface TagDrawerProps {
	tags: TagItem[];
	afterCreate: (values: TagFormResult) => void;
	afterEdit: (values: TagFormResult, tag: TagItem) => void;
}

const TagDrawer = forwardRef<TagDrawerHandle, TagDrawerProps>(function TagDrawer(
	{ tags, afterCreate, afterEdit },
	ref,
) {
	const [form] = Form.useForm<TagFormValues>();
	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState<FormMode>(FormMode.CREATE);
	const [tag, setTag] = useState<TagItem | null>(null);

	const handleClose = useCallback(() => {
		setOpen(false);
	}, []);

	const handleConfirm = useCallback(async () => {
		try {
			const values = await form.validateFields();
			const result: TagFormResult = {
				key: values.key.trim(),
				desc: values.desc.trim(),
			};

			if (mode === FormMode.CREATE) {
				afterCreate(result);
			} else if (tag) {
				afterEdit(result, tag);
			}

			setOpen(false);
		} catch {
			// 字段错误由 Form.Item 展示，Drawer 保持打开
		}
	}, [afterCreate, afterEdit, form, mode, tag]);

	const keyRules = useMemo(() => {
		return [
			{ required: true, whitespace: true, message: "标签 key 不能为空" },
			{
				validator: (_: unknown, value: string) => {
					const key = value?.trim() ?? "";
					if (key === "") {
						return Promise.resolve();
					}
					for (let i = 0; i < tags.length; i++) {
						if (tags[i].id !== tag?.id && tags[i].key.trim() === key) {
							return Promise.reject(new Error("key 已被其他标签占用"));
						}
					}
					return Promise.resolve();
				},
			},
		];
	}, [tags, tag]);

	useImperativeHandle(
		ref,
		() => ({
			create() {
				setMode(FormMode.CREATE);
				setTag(null);
				setOpen(true);
				form.resetFields();
				form.setFieldsValue({ key: "", desc: "" });
			},
			edit(nextTag) {
				setMode(FormMode.EDIT);
				setTag(nextTag);
				setOpen(true);
				form.resetFields();
				form.setFieldsValue({ key: nextTag.key, desc: nextTag.desc });
			},
			close() {
				setOpen(false);
			},
		}),
		[form],
	);

	return (
		<Drawer
			title={mode === FormMode.CREATE ? "新建标签" : "编辑标签"}
			open={open}
			onClose={handleClose}
			size={420}
			forceRender
			footer={
				<div className={style.footer}>
					<Button onClick={handleClose}>取消</Button>
					<Button type="primary" onClick={handleConfirm}>
						确认
					</Button>
				</div>
			}
		>
			<Form form={form} layout="vertical" colon={false}>
				<Form.Item label="标签 key" name="key" rules={keyRules} tooltip="展示名；规则引用标签 id">
					<Input placeholder="例如：活体" aria-label="标签 key" />
				</Form.Item>

				<Form.Item label="描述" name="desc" tooltip="说明这个标签在故事里的含义">
					<Input.TextArea rows={5} placeholder="这个标签代表什么？" aria-label="标签描述" />
				</Form.Item>

				{mode === FormMode.EDIT && tag && <div className={style.meta}>标签 ID #{tag.id}</div>}
			</Form>
		</Drawer>
	);
});

export default TagDrawer;
