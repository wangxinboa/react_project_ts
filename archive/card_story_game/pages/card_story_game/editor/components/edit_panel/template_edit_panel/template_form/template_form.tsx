import { useState } from "react";
import { Button, Form, Input, Select } from "antd";

import type { CardTemplate, RuleAction, TagItem, TemplateAttribute } from "../../../../../card_story_game_types.ts";
import { getDuplicateAttributeName } from "../../../../../validate/index.ts";
import TemplateAttributeRow from "./template_attribute_row.tsx";

import style from "./template_form.module.scss";

interface TemplateFormValues {
	key: string;
	tags: number[];
	attributes: TemplateAttribute[];
	auto: number[];
	outgoing: number[];
	incoming: number[];
}

type AddAttribute = (defaultValue?: TemplateAttribute, insertIndex?: number) => void;
type RemoveAttribute = (index: number | number[]) => void;

interface TemplateFormProps {
	template: CardTemplate;
	keyError: string;
	tags: TagItem[];
	actions: RuleAction[];
	onUpdate: (id: number, patch: Partial<Omit<CardTemplate, "id">>) => void;
}

export default function TemplateForm({ template, keyError, tags, actions, onUpdate }: TemplateFormProps) {
	const [form] = Form.useForm<TemplateFormValues>();
	const [attributeError, setAttributeError] = useState("");

	const initialAttributes: TemplateAttribute[] = template.attributes.map((attribute) => ({ ...attribute }));

	const tagOptions = tags.map((tag) => ({
		value: tag.id,
		label: tag.key.trim() || `#${tag.id}`,
	}));
	const actionOptions = actions.map((action) => ({
		value: action.id,
		label: `${action.verb.trim() || "未命名"} #${action.id}`,
	}));

	const handleValuesChange = (_changed: Partial<TemplateFormValues>, values: TemplateFormValues) => {
		const attributes = values.attributes ?? [];
		const duplicate = getDuplicateAttributeName(attributes.map((attribute) => attribute.name));
		setAttributeError(duplicate !== null ? `字段名「${duplicate}」重复` : "");

		const patch: Partial<Omit<CardTemplate, "id">> = {
			key: values.key,
			tags: values.tags ?? [],
			attributes,
			auto: values.auto ?? [],
			outgoing: values.outgoing ?? [],
			incoming: values.incoming ?? [],
		};

		onUpdate(template.id, patch);
	};

	const handleAddAttribute = (add: AddAttribute) => {
		const current = (form.getFieldValue("attributes") as TemplateAttribute[] | undefined) ?? initialAttributes;
		const usedNames = new Set<string>();
		for (let i = 0; i < current.length; i++) {
			usedNames.add(current[i].name);
		}

		let index = current.length + 1;
		let name = `field${index}`;
		while (usedNames.has(name)) {
			index++;
			name = `field${index}`;
		}

		add({ name, value: 0 });
	};

	const handleRemoveAttribute = (remove: RemoveAttribute, index: number) => {
		remove(index);
	};

	return (
		<Form
			form={form}
			layout="vertical"
			colon={false}
			initialValues={{
				key: template.key,
				tags: template.tags,
				attributes: initialAttributes,
				auto: template.auto,
				outgoing: template.outgoing,
				incoming: template.incoming,
			}}
			onValuesChange={handleValuesChange}
		>
			<Form.Item
				label="模板 key"
				name="key"
				tooltip="展示名；规则与引用通过模板 id 关联"
				help={keyError || undefined}
				validateStatus={keyError ? "error" : undefined}
			>
				<Input placeholder="例如：碳基生物" aria-label="模板 key" />
			</Form.Item>

			<Form.Item label="初始标签" name="tags" tooltip="模板实例化时带上的标签">
				<Select
					mode="multiple"
					options={tagOptions}
					optionFilterProp="label"
					placeholder="选择标签"
					aria-label="初始标签"
					allowClear
					maxTagCount="responsive"
				/>
			</Form.Item>

			<Form.Item
				label="attributes"
				tooltip="字段初始值；字段类型后续接入"
				help={attributeError || undefined}
				validateStatus={attributeError ? "error" : undefined}
			>
				<Form.List name="attributes">
					{(fields, { add, remove }) => (
						<div className={style.attributes}>
							{fields.length > 0 && (
								<div className={style.attributeHeader}>
									<span className={style.attributeNameField}>字段名</span>
									<span className={style.attributeValueField}>初始值</span>
									<span className={style.attributeRowAction} />
								</div>
							)}
							{fields.map(({ key, name }) => (
								<TemplateAttributeRow key={key} name={name} onRemove={() => handleRemoveAttribute(remove, name)} />
							))}
							{fields.length === 0 && <div className={style.emptyAttributes}>暂无字段</div>}
							<Button className={style.addAttribute} size="small" onClick={() => handleAddAttribute(add)}>
								+ 添加字段
							</Button>
						</div>
					)}
				</Form.List>
			</Form.Item>

			<Form.Item label="auto" name="auto" tooltip="时间推进时自动执行的动作">
				<Select
					mode="multiple"
					options={actionOptions}
					optionFilterProp="label"
					placeholder="选择自动动作"
					aria-label="auto 动作"
					allowClear
				/>
			</Form.Item>

			<Form.Item label="outgoing" name="outgoing" tooltip="卡牌主动发起时执行的动作">
				<Select
					mode="multiple"
					options={actionOptions}
					optionFilterProp="label"
					placeholder="选择主动动作"
					aria-label="outgoing 动作"
					allowClear
					maxTagCount="responsive"
				/>
			</Form.Item>

			<Form.Item label="incoming" name="incoming" tooltip="卡牌被作用时响应执行的动作">
				<Select
					mode="multiple"
					options={actionOptions}
					optionFilterProp="label"
					placeholder="选择受影响动作"
					aria-label="incoming 动作"
					allowClear
					maxTagCount="responsive"
				/>
			</Form.Item>
		</Form>
	);
}
