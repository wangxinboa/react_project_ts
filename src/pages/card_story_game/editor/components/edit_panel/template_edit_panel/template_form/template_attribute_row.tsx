import { DeleteOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber } from "antd";

import style from "./template_form.module.scss";

interface TemplateAttributeRowProps {
	name: number;
	onRemove: () => void;
}

const NAME_RULES = [{ required: true, whitespace: true, message: "字段名不能为空" }];

export default function TemplateAttributeRow({ name, onRemove }: TemplateAttributeRowProps) {
	return (
		<div className={style.attributeRow}>
			<Form.Item
				name={[name, "name"]}
				rules={NAME_RULES}
				className={style.attributeNameField}
			>
				<Input placeholder="字段名" aria-label="字段名" />
			</Form.Item>
			<Form.Item name={[name, "value"]} className={style.attributeValueField}>
				<InputNumber placeholder="初始值" style={{ width: "100%" }} aria-label="字段初始值" />
			</Form.Item>
			<Button
				className={style.attributeRowAction}
				type="text"
				danger
				size="small"
				icon={<DeleteOutlined />}
				onClick={onRemove}
				title="删除字段"
				aria-label="删除字段"
			/>
		</div>
	);
}
