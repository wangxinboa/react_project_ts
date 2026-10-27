import { DeleteOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Select } from "antd";
import type { FormInstance } from "antd";

import { ActionParamType } from "../../../../../card_story_game_types.ts";

import style from "./action_form.module.scss";

const PARAM_TYPE_OPTIONS = [
	{ value: ActionParamType.CARD, label: "卡牌" },
	{ value: ActionParamType.NUMBER, label: "数值" },
];

const NAME_RULES = [{ required: true, whitespace: true, message: "参数名不能为空" }];

interface ActionParamRowProps {
	name: number;
	form: FormInstance;
	type: ActionParamType;
	onRemove: () => void;
}

export default function ActionParamRow({ name, form, type, onRemove }: ActionParamRowProps) {
	const handleTypeChange = (value: ActionParamType) => {
		if (value === ActionParamType.CARD) {
			form.setFieldValue(["params", name, "default"], undefined);
		}
	};

	return (
		<div className={style.paramRow}>
			<Form.Item name={[name, "name"]} rules={NAME_RULES} className={style.nameField}>
				<Input placeholder="参数名" aria-label="参数名" />
			</Form.Item>
			<Form.Item name={[name, "type"]} className={style.typeField}>
				<Select options={PARAM_TYPE_OPTIONS} onChange={handleTypeChange} aria-label="参数类型" />
			</Form.Item>
			<Form.Item name={[name, "default"]} className={style.defaultField}>
				<InputNumber
					disabled={type === ActionParamType.CARD}
					placeholder="默认值"
					style={{ width: "100%" }}
					aria-label="参数默认值"
				/>
			</Form.Item>
			<Button
				className={style.rowAction}
				type="text"
				danger
				size="small"
				icon={<DeleteOutlined />}
				onClick={onRemove}
				title="删除参数"
				aria-label="删除参数"
			/>
		</div>
	);
}
