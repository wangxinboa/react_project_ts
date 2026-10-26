import { useState } from "react";
import { Form, Input } from "antd";

import style from "./action_form.module.scss";

interface JsonArrayFieldProps {
	label: string;
	/** 初始值；编辑期间以内部草稿为准，避免非法 JSON 把输入框打回 */
	value: unknown[];
	onChange: (value: unknown[]) => void;
}

export default function JsonArrayField({ label, value, onChange }: JsonArrayFieldProps) {
	const [draft, setDraft] = useState(() => JSON.stringify(value, null, 2));
	const [error, setError] = useState("");

	// 失焦时解析：只有合法 JSON 数组才提交，否则保留草稿并提示
	const handleBlur = () => {
		try {
			const parsed: unknown = JSON.parse(draft);
			if (!Array.isArray(parsed)) {
				throw new Error("不是数组");
			}
			onChange(parsed);
			setError("");
		} catch {
			setError("必须是合法的 JSON 数组");
		}
	};

	return (
		<Form.Item
			label={label}
			help={error || "JSON 数组"}
			validateStatus={error ? "error" : undefined}
		>
			<Input.TextArea
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={handleBlur}
				autoSize={{ minRows: 4, maxRows: 10 }}
				spellCheck={false}
				className={style.jsonTextarea}
				placeholder="[]"
				aria-label={`${label} JSON`}
			/>
		</Form.Item>
	);
}
