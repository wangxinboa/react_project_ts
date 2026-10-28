import { useState } from "react";
import { Button, Form, Input } from "antd";

import { ActionParamType } from "../../../../../card_story_game_types.ts";
import type { ActionParam, RuleAction } from "../../../../../card_story_game_types.ts";
import { getDuplicateActionParamName, normalizeActionParams } from "../../../../../validate/index.ts";

import style from "./action_form.module.scss";
import ActionParamRow from "./action_param_row.tsx";
import JsonArrayField from "./json_array_field.tsx";

interface ActionFormValues {
	verb: string;
	params: ActionParam[];
}

type AddParam = (defaultValue?: ActionParam, insertIndex?: number) => void;
type RemoveParam = (index: number | number[]) => void;

interface ActionFormProps {
	action: RuleAction;
	onUpdate: (id: number, patch: Partial<Omit<RuleAction, "id">>) => void;
}

export default function ActionForm({ action, onUpdate }: ActionFormProps) {
	const [form] = Form.useForm<ActionFormValues>();
	const [paramNameError, setParamNameError] = useState("");

	const updateParamNameError = (params: ActionParam[]) => {
		const duplicate = getDuplicateActionParamName(params);
		setParamNameError(duplicate !== null ? `参数名「${duplicate}」重复` : "");
	};

	const handleValuesChange = (_changed: Partial<ActionFormValues>, values: ActionFormValues) => {
		const params = normalizeActionParams(values.params ?? []);
		onUpdate(action.id, { verb: values.verb, params });
		updateParamNameError(params);
	};

	const handleAddParam = (add: AddParam) => {
		const current = (form.getFieldValue("params") as ActionParam[] | undefined) ?? action.params;
		const usedNames = new Set<string>();
		for (let i = 0; i < current.length; i++) {
			usedNames.add(current[i].name);
		}

		let index = current.length + 1;
		let name = `arg${index}`;
		while (usedNames.has(name)) {
			index++;
			name = `arg${index}`;
		}

		const newParam: ActionParam = { name, type: ActionParamType.NUMBER };
		const next = [...current, newParam];
		add(newParam);
		onUpdate(action.id, { params: next });
		updateParamNameError(next);
	};

	const handleRemoveParam = (remove: RemoveParam, index: number) => {
		const current = (form.getFieldValue("params") as ActionParam[] | undefined) ?? action.params;
		const next: ActionParam[] = [];
		for (let i = 0; i < current.length; i++) {
			if (i !== index) {
				next.push(current[i]);
			}
		}
		remove(index);
		onUpdate(action.id, { params: next });
		updateParamNameError(next);
	};

	const handleTargetsChange = (value: unknown[]) => {
		onUpdate(action.id, { targets: value });
	};

	const handleConditionsChange = (value: unknown[]) => {
		onUpdate(action.id, { conditions: value });
	};

	const handleEffectsChange = (value: unknown[]) => {
		onUpdate(action.id, { effects: value });
	};

	return (
		<Form
			form={form}
			layout="vertical"
			colon={false}
			initialValues={{ verb: action.verb, params: action.params }}
			onValuesChange={handleValuesChange}
		>
			<Form.Item label="verb" name="verb" tooltip="动作协议；同一个 verb 可以有多条动作">
				<Input placeholder="例如 consume" aria-label="verb" />
			</Form.Item>

			<Form.Item
				label="参数"
				tooltip="参数会以 args.<name> 的形式在动作体里访问"
				help={paramNameError || undefined}
				validateStatus={paramNameError ? "error" : undefined}
			>
				<Form.List name="params">
					{(fields, { add, remove }) => (
						<div className={style.params}>
							{fields.length > 0 && (
								<div className={style.paramHeader}>
									<span className={style.nameField}>参数名</span>
									<span className={style.typeField}>类型</span>
									<span className={style.defaultField}>默认值</span>
									<span className={style.rowAction} />
								</div>
							)}
							{fields.map(({ key, name }) => (
								<ActionParamRow
									key={key}
									name={name}
									form={form}
									type={action.params[name]?.type ?? ActionParamType.NUMBER}
									onRemove={() => handleRemoveParam(remove, name)}
								/>
							))}
							{fields.length === 0 && <div className={style.emptyParams}>暂无参数</div>}
							<Button className={style.addParam} size="small" onClick={() => handleAddParam(add)}>
								+ 添加参数
							</Button>
						</div>
					)}
				</Form.List>
			</Form.Item>

			<JsonArrayField label="targets" value={action.targets} onChange={handleTargetsChange} />
			<JsonArrayField label="conditions" value={action.conditions} onChange={handleConditionsChange} />
			<JsonArrayField label="effects" value={action.effects} onChange={handleEffectsChange} />
		</Form>
	);
}
