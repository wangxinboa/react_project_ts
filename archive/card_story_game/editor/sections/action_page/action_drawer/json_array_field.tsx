import { Form, Input } from "antd";

import { parseJsonArray } from "../../../../../../utils/json.ts";

import style from "./action_drawer.module.scss";

interface JsonArrayFieldProps {
	label: string;
	name: string;
	tooltip: string;
}

const rules = [
	{
		validator: (_: unknown, value: string) => {
			if (parseJsonArray(value) === null) {
				return Promise.reject(new Error("必须是合法 JSON 数组"));
			}
			return Promise.resolve();
		},
	},
];

export default function JsonArrayField({ label, name, tooltip }: JsonArrayFieldProps) {
	return (
		<Form.Item
			label={label}
			name={name}
			rules={rules}
			tooltip={tooltip}
			validateTrigger="onBlur"
		>
			<Input.TextArea className={style.jsonInput} rows={4} aria-label={`${label} JSON`} />
		</Form.Item>
	);
}
