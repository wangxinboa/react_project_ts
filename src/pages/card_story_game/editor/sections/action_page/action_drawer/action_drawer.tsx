import { Button, Drawer, Form, Input } from "antd";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from "react";

import type { ActionParam, RuleAction } from "../../../../card_story_game_types.ts";
import { ActionParamType } from "../../../../card_story_game_types.ts";
import { FormMode } from "../../../../../../utils/form_mode.ts";
import { parseJsonArray } from "../../../../../../utils/json.ts";

import ActionParamRow from "./action_param_row.tsx";
import JsonArrayField from "./json_array_field.tsx";

import style from "./action_drawer.module.scss";

interface ActionParamFormValue {
	name: string;
	type: ActionParamType;
	default?: number | null;
}

interface ActionFormValues {
	verb: string;
	desc: string;
	params: ActionParamFormValue[];
	targets: string;
	conditions: string;
	effects: string;
}

interface ActionFormResult {
	verb: string;
	desc: string;
	params: ActionParam[];
	targets: unknown[];
	conditions: unknown[];
	effects: unknown[];
}

export interface ActionDrawerHandle {
	create: () => void;
	edit: (action: RuleAction) => void;
	close: () => void;
}

interface ActionDrawerProps {
	afterCreate: (values: ActionFormResult) => void;
	afterEdit: (values: ActionFormResult, action: RuleAction) => void;
}

function getDuplicateParamName(params: { name: string }[]): string | null {
	const seen = new Set<string>();
	for (let i = 0; i < params.length; i++) {
		const name = params[i].name.trim();
		if (name === "") {
			continue;
		}
		if (seen.has(name)) {
			return name;
		}
		seen.add(name);
	}
	return null;
}

function normalizeParams(params: ActionParamFormValue[]): ActionParam[] {
	const result: ActionParam[] = [];
	for (let i = 0; i < params.length; i++) {
		const param = params[i];
		const name = param.name.trim();
		if (param.type === ActionParamType.NUMBER) {
			result.push({
				name,
				type: param.type,
				...(typeof param.default === "number" ? { default: param.default } : {}),
			});
		} else {
			result.push({ name, type: param.type });
		}
	}
	return result;
}

function toFormValues(action: RuleAction | null): ActionFormValues {
	const params: ActionParamFormValue[] = [];
	if (action) {
		for (let i = 0; i < action.params.length; i++) {
			params.push({ ...action.params[i] });
		}
	}

	return {
		verb: action?.verb ?? "",
		desc: action?.desc ?? "",
		params,
		targets: JSON.stringify(action?.targets ?? [], null, 2),
		conditions: JSON.stringify(action?.conditions ?? [], null, 2),
		effects: JSON.stringify(action?.effects ?? [], null, 2),
	};
}

const ActionDrawer = forwardRef<ActionDrawerHandle, ActionDrawerProps>(function ActionDrawer(
	{ afterCreate, afterEdit },
	ref,
) {
	const [form] = Form.useForm<ActionFormValues>();
	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState<FormMode>(FormMode.CREATE);
	const [action, setAction] = useState<RuleAction | null>(null);
	const watchedParams = Form.useWatch("params", form);
	const paramNameError = useMemo(() => {
		const duplicate = getDuplicateParamName(watchedParams ?? []);
		return duplicate === null ? "" : `参数名「${duplicate}」重复`;
	}, [watchedParams]);

	const handleClose = useCallback(() => {
		setOpen(false);
	}, []);

	const handleConfirm = useCallback(async () => {
		try {
			const values = await form.validateFields();
			const params = normalizeParams(values.params);
			if (getDuplicateParamName(params) !== null) {
				return;
			}

			const targets = parseJsonArray(values.targets);
			const conditions = parseJsonArray(values.conditions);
			const effects = parseJsonArray(values.effects);
			if (targets === null || conditions === null || effects === null) {
				return;
			}

			const result: ActionFormResult = {
				verb: values.verb.trim(),
				desc: values.desc.trim(),
				params,
				targets,
				conditions,
				effects,
			};

			if (mode === FormMode.CREATE) {
				afterCreate(result);
			} else if (action) {
				afterEdit(result, action);
			}

			setOpen(false);
		} catch {
			// 字段错误由 Form.Item 展示，Drawer 保持打开
		}
	}, [afterCreate, afterEdit, action, form, mode]);

	useImperativeHandle(
		ref,
		() => ({
			create() {
				setMode(FormMode.CREATE);
				setAction(null);
				setOpen(true);
				form.resetFields();
				form.setFieldsValue(toFormValues(null));
			},
			edit(nextAction) {
				setMode(FormMode.EDIT);
				setAction(nextAction);
				setOpen(true);
				form.resetFields();
				form.setFieldsValue(toFormValues(nextAction));
			},
			close() {
				setOpen(false);
			},
		}),
		[form],
	);

	return (
		<Drawer
			title={mode === FormMode.CREATE ? "新建动作" : "编辑动作"}
			open={open}
			onClose={handleClose}
			size={560}
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
				<Form.Item
					label="verb"
					name="verb"
					rules={[{ required: true, whitespace: true, message: "verb 不能为空" }]}
					tooltip="动作协议名；同名 verb 可以对应多条动作"
				>
					<Input placeholder="例如：consume" aria-label="动作 verb" />
				</Form.Item>

				<Form.Item label="描述" name="desc" tooltip="给编辑者看的说明">
					<Input.TextArea rows={2} placeholder="这个动作做什么？" aria-label="动作描述" />
				</Form.Item>

				<Form.Item
					label="参数"
					help={paramNameError || undefined}
					validateStatus={paramNameError ? "error" : undefined}
				>
					<Form.List name="params">
						{(fields, { add, remove }) => (
							<div className={style.params}>
								{fields.length > 0 && (
									<div className={style.paramHeader}>
										<span className={style.paramNameField}>参数名</span>
										<span className={style.paramTypeField}>类型</span>
										<span className={style.paramDefaultField}>默认值</span>
										<span className={style.paramRowAction} />
									</div>
								)}
								{fields.map(({ key, name }) => (
									<ActionParamRow key={key} name={name} onRemove={() => remove(name)} />
								))}
								<Button
									className={style.addParam}
									size="small"
									onClick={() => add({ name: "", type: ActionParamType.NUMBER })}
								>
									+ 添加参数
								</Button>
							</div>
						)}
					</Form.List>
				</Form.Item>

				<JsonArrayField label="targets" name="targets" tooltip="动作作用的目标，先直接编辑 JSON 数组" />
				<JsonArrayField label="conditions" name="conditions" tooltip="执行条件，先直接编辑 JSON 数组" />
				<JsonArrayField label="effects" name="effects" tooltip="执行效果，先直接编辑 JSON 数组" />
			</Form>
		</Drawer>
	);
});

export default ActionDrawer;
