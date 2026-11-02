import { Button, Drawer, Form, Input } from "antd";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";

import type { Condition, EffectCall, RuleAction } from "../../../../card_story_game_types/index.ts";
import { FormMode } from "../../../../../../utils/form_mode.ts";
import { parseJsonArray } from "../../../../../../utils/json.ts";

import JsonArrayField from "./json_array_field.tsx";

import style from "./action_drawer.module.scss";

interface ActionFormValues {
	verb: string;
	desc: string;
	targets: string;
	conditions: string;
	effects: string;
}

interface ActionFormResult {
	verb: string;
	desc: string;
	targets: unknown[];
	conditions: Condition[];
	effects: EffectCall[];
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

function toFormValues(action: RuleAction | null): ActionFormValues {
	return {
		verb: action?.verb ?? "",
		desc: action?.desc ?? "",
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
	const handleClose = useCallback(() => {
		setOpen(false);
	}, []);

	const handleConfirm = useCallback(async () => {
		try {
			const values = await form.validateFields();
			const targets = parseJsonArray(values.targets);
			const conditions = parseJsonArray(values.conditions) as Condition[] | null;
			const effects = parseJsonArray(values.effects) as EffectCall[] | null;
			if (targets === null || conditions === null || effects === null) {
				return;
			}

			const result: ActionFormResult = {
				verb: values.verb.trim(),
				desc: values.desc.trim(),
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

				<JsonArrayField label="targets" name="targets" tooltip="动作作用的目标，先直接编辑 JSON 数组" />
				<JsonArrayField label="conditions" name="conditions" tooltip="执行条件，先直接编辑 JSON 数组" />
				<JsonArrayField label="effects" name="effects" tooltip="执行效果，先直接编辑 JSON 数组" />
			</Form>
		</Drawer>
	);
});

export default ActionDrawer;
