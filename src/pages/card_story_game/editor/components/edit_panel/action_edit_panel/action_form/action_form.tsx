import { Button, Form, Input, InputNumber, Select } from "antd";

import { ActionParamType } from "../../../../../card_story_game_types.ts";
import type { ActionParam, RuleAction } from "../../../../../card_story_game_types.ts";

import style from "./action_form.module.scss";
import JsonArrayField from "./json_array_field.tsx";

const JSON_FIELDS = ["targets", "conditions", "effects"] as const;

const PARAM_TYPE_OPTIONS = [
	{ value: ActionParamType.CARD, label: "卡牌" },
	{ value: ActionParamType.NUMBER, label: "数值" },
];

interface ActionFormProps {
	action: RuleAction;
	onUpdate: (id: number, patch: Partial<Omit<RuleAction, "id">>) => void;
}

export default function ActionForm({ action, onUpdate }: ActionFormProps) {
	const handleVerbChange = (value: string) => {
		onUpdate(action.id, { verb: value });
	};

	const updateParam = (index: number, patch: Partial<ActionParam>) => {
		const params = action.params.map((param, i) => (i === index ? { ...param, ...patch } : param));
		onUpdate(action.id, { params });
	};

	const handleParamTypeChange = (index: number, type: ActionParamType) => {
		const params = action.params.map((param, i) => {
			if (i !== index) {
				return param;
			}
			const next: ActionParam = { ...param, type };
			if (type === ActionParamType.CARD) {
				delete next.default;
			}
			return next;
		});
		onUpdate(action.id, { params });
	};

	const handleParamDefaultChange = (index: number, value: number | null) => {
		const params = action.params.map((param, i) => {
			if (i !== index) {
				return param;
			}
			const next: ActionParam = { ...param };
			if (value === null) {
				delete next.default;
			} else {
				next.default = value;
			}
			return next;
		});
		onUpdate(action.id, { params });
	};

	const handleAddParam = () => {
		const usedNames = new Set<string>();
		for (let i = 0; i < action.params.length; i++) {
			usedNames.add(action.params[i].name);
		}

		let index = action.params.length + 1;
		let name = `arg${index}`;
		while (usedNames.has(name)) {
			index++;
			name = `arg${index}`;
		}

		const newParam: ActionParam = { name, type: ActionParamType.NUMBER };
		onUpdate(action.id, { params: [...action.params, newParam] });
	};

	const handleRemoveParam = (index: number) => {
		const params: ActionParam[] = [];
		for (let i = 0; i < action.params.length; i++) {
			if (i !== index) {
				params.push(action.params[i]);
			}
		}
		onUpdate(action.id, { params });
	};

	return (
		<Form layout="vertical" colon={false}>
			<Form.Item label="verb" help="动作协议；同一个 verb 可以有多条动作">
				<Input
					id={`action-verb-${action.id}`}
					value={action.verb}
					onChange={(e) => handleVerbChange(e.target.value)}
					placeholder="例如 consume"
					aria-label="verb"
				/>
			</Form.Item>

			<Form.Item label="参数" help="参数会以 args.<name> 的形式在动作体里访问">
				<div className={style.params}>
					{action.params.length === 0 ? (
						<div className={style.emptyParams}>暂无参数</div>
					) : (
						<>
							{action.params.map((param, index) => (
								<div className={style.paramRow} key={index}>
									<Input
										value={param.name}
										onChange={(e) => updateParam(index, { name: e.target.value })}
										placeholder="参数名"
									/>
									<Select
										value={param.type}
										options={PARAM_TYPE_OPTIONS}
										onChange={(value: ActionParamType) => handleParamTypeChange(index, value)}
									/>
									<InputNumber
										value={param.default ?? null}
										onChange={(value) => handleParamDefaultChange(index, value)}
										disabled={param.type === ActionParamType.CARD}
										placeholder="默认值"
										style={{ width: "100%" }}
									/>
									<Button type="text" danger size="small" onClick={() => handleRemoveParam(index)}>
										删除
									</Button>
								</div>
							))}
						</>
					)}
					<Button className={style.addParam} size="small" onClick={handleAddParam}>
						+ 添加参数
					</Button>
				</div>
			</Form.Item>

			{JSON_FIELDS.map((field) => (
				<JsonArrayField
					key={field}
					label={field}
					value={action[field]}
					onChange={(value) => {
						const patch: Partial<Omit<RuleAction, "id">> = {};
						patch[field] = value;
						onUpdate(action.id, patch);
					}}
				/>
			))}
		</Form>
	);
}
