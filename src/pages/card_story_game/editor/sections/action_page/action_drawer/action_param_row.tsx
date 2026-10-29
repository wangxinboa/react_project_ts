import { DeleteOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Select } from "antd";

import { ActionParamType } from "../../../../card_story_game_types.ts";

import style from "./action_drawer.module.scss";

const TYPE_OPTIONS = [
	{ value: ActionParamType.CARD, label: "卡牌" },
	{ value: ActionParamType.NUMBER, label: "数字" },
];

const NAME_RULES = [{ required: true, whitespace: true, message: "参数名不能为空" }];

interface ActionParamRowProps {
	name: number;
	onRemove: () => void;
}

export default function ActionParamRow({ name, onRemove }: ActionParamRowProps) {
	return (
		<div className={style.paramRow}>
			<Form.Item name={[name, "name"]} rules={NAME_RULES} className={style.paramNameField}>
				<Input placeholder="参数名" aria-label="参数名" />
			</Form.Item>
			<Form.Item name={[name, "type"]} className={style.paramTypeField}>
				<Select options={TYPE_OPTIONS} aria-label="参数类型" />
			</Form.Item>
			<Form.Item name={[name, "default"]} className={style.paramDefaultField}>
				<InputNumber className={style.paramDefaultInput} placeholder="默认值" aria-label="参数默认值" />
			</Form.Item>
			<Button
				className={style.paramRowAction}
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
