import { forwardRef, memo, useCallback, useImperativeHandle, useMemo, useState } from "react";
import { Button, Drawer, Form, Input, Select } from "antd";

import { AttributeType } from "../../../../card_story_game_types/index.ts";
import type { AttributeDefinition } from "../../../../card_story_game_types/index.ts";
import { FormMode } from "../../../../../../utils/form_mode.ts";
import { AttributeTypeOptions } from "../attribute_type_meta.ts";
import CustomInput from "../../../../../../components/custom_input/custom_input.tsx";
import CustomTextArea from "../../../../../../components/custom_text_area/custom_text_area.tsx";
import JsonFieldTextArea from "../../../../../../components/json_field_text_area/json_field_text_area.tsx";
import style from "./attribute_drawer.module.scss";

export interface AttributeDrawerHandle {
	create: () => void;
	edit: (attribute: AttributeDefinition) => void;
	copy: (attribute: AttributeDefinition) => void;
	close: () => void;
}

interface AttributeDrawerProps {
	attributes: AttributeDefinition[];
	nextId: number;
	finishCreate: (values: AttributeDefinition) => boolean;
	finishCopy: (values: AttributeDefinition, attribute: AttributeDefinition) => boolean;
	finishEdit: (values: AttributeDefinition, attribute: AttributeDefinition) => boolean;
}

/** 新建 / 编辑 / 复制属性抽屉。 */
const AttributeDrawer = memo(
	forwardRef<AttributeDrawerHandle, AttributeDrawerProps>(function AttributeDrawer(
		{ attributes, nextId, finishCreate, finishCopy, finishEdit },
		ref,
	) {
		const [form] = Form.useForm<AttributeDefinition>();
		const [open, setOpen] = useState(false);
		const [mode, setMode] = useState<FormMode>(FormMode.CREATE);
		const [attribute, setAttribute] = useState<AttributeDefinition | null>(null);

		const existingKeys = useMemo(
			() => attributes.filter((item) => mode !== FormMode.EDIT || item.id !== attribute?.id).map((item) => item.key),
			[attributes, attribute, mode],
		);

		const title = useMemo(() => {
			if (mode === FormMode.EDIT) {
				return `编辑属性 #${attribute?.id ?? ""}`;
			}

			if (mode === FormMode.COPY) {
				return `复制属性 #${attribute?.id ?? ""}`;
			}

			return "新建属性";
		}, [attribute, mode]);

		const handleClose = useCallback(() => {
			form.resetFields();
			setOpen(false);
		}, [form]);

		const handleConfirm = useCallback(async () => {
			try {
				const values = await form.validateFields();
				let accepted = false;

				if (mode === FormMode.CREATE) {
					accepted = finishCreate(values);
				} else if (mode === FormMode.EDIT && attribute) {
					accepted = finishEdit(values, attribute);
				} else if (mode === FormMode.COPY && attribute) {
					accepted = finishCopy(values, attribute);
				}

				if (accepted) handleClose();
			} catch {
				// 字段错误由 Form.Item 展示，Drawer 保持打开
			}
		}, [attribute, finishCopy, finishCreate, finishEdit, form, handleClose, mode]);

		useImperativeHandle(
			ref,
			() => ({
				create() {
					setMode(FormMode.CREATE);
					setAttribute(null);
					setOpen(true);
					form.setFieldsValue({ id: nextId } as AttributeDefinition);
				},
				edit(nextAttribute) {
					setMode(FormMode.EDIT);
					setAttribute(nextAttribute);
					setOpen(true);
					form.setFieldsValue({ ...nextAttribute });
				},
				copy(nextAttribute) {
					setMode(FormMode.COPY);
					setAttribute(nextAttribute);
					setOpen(true);
					form.setFieldsValue({ ...nextAttribute, id: nextId });
				},
				close() {
					handleClose();
				},
			}),
			[form, handleClose, nextId],
		);

		return (
			<Drawer
				title={title}
				open={open}
				onClose={handleClose}
				size={520}
				forceRender
				footer={
					<div className={style.footer}>
						<Button onClick={handleClose}>取消</Button>
						<Button type="primary" onClick={handleConfirm}>
							保存
						</Button>
					</div>
				}
			>
				<Form<AttributeDefinition>
					form={form}
					layout="horizontal"
					labelAlign="left"
					labelCol={{ flex: "72px" }}
					wrapperCol={{ flex: 1 }}
					colon={false}
				>
					<Form.Item name="id" label="ID">
						<Input disabled />
					</Form.Item>

					<Form.Item
						name="key"
						label="key"
						rules={[
							{ required: true, message: "请输入 key" },
							{
								validator: (_, value: string) => {
									if (!value || !existingKeys.includes(value.trim())) return Promise.resolve();
									return Promise.reject(new Error("key 已存在"));
								},
							},
						]}
					>
						<CustomInput placeholder="例如 satiety" />
					</Form.Item>

					<Form.Item name="type" label="type" rules={[{ required: true }]}>
						<Select options={AttributeTypeOptions} />
					</Form.Item>

					<Form.Item name="label" label="label">
						<CustomInput placeholder="例如 饱食" />
					</Form.Item>

					<Form.Item name="desc" label="desc">
						<CustomTextArea rows={3} placeholder="给编辑者看的说明" />
					</Form.Item>

					<Form.Item noStyle shouldUpdate={(prev, next) => prev.type !== next.type}>
						{({ getFieldValue }) => {
							if (getFieldValue("type") !== AttributeType.DERIVED_NUMBER) return null;
							return (
								<Form.Item
									name="formula"
									label="formula"
									preserve={false}
									extra={
										<span className={style.formulaHint}>使用 Formula JSON，例如 {`{"op":"literal","value":0}`}</span>
									}
									rules={[{ required: true, message: "派生属性必须提供 formula" }]}
								>
									<JsonFieldTextArea />
								</Form.Item>
							);
						}}
					</Form.Item>
				</Form>
			</Drawer>
		);
	}),
);

export default AttributeDrawer;
