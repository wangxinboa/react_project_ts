import { memo, useCallback, useRef } from "react";
import { App, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import type { AttributeDefinition } from "../../../card_story_game_types/index.ts";
import AttributeDrawer from "./attribute_drawer/attribute_drawer.tsx";
import AttributeTable from "./attribute_table/attribute_table.tsx";
import type { AttributeDrawerHandle } from "./attribute_drawer/attribute_drawer.tsx";
import { useClientPagination } from "../../../../../hooks/use_client_pagination.ts";
import style from "./attribute_page.module.scss";

interface AttributePageProps {
	attributes: AttributeDefinition[];
	onAttributesChange: (updater: (prev: AttributeDefinition[]) => AttributeDefinition[]) => void;
}

function getNextId(attributes: AttributeDefinition[]): number {
	let maxId = 0;
	for (const attribute of attributes) {
		if (attribute.id > maxId) maxId = attribute.id;
	}
	return maxId + 1;
}

/** 属性定义列表与编辑入口。 */
const AttributePage = memo(function AttributePage({ attributes, onAttributesChange }: AttributePageProps) {
	const { message } = App.useApp();
	const drawerRef = useRef<AttributeDrawerHandle>(null);
	const {
		total,
		pageSize,
		currentPage,
		pagedItems: pagedAttributes,
		handlePageChange,
		resetPage,
	} = useClientPagination(attributes);

	const handleStartCreate = useCallback(() => {
		drawerRef.current?.create();
	}, []);

	const handleStartEdit = useCallback((attribute: AttributeDefinition) => {
		drawerRef.current?.edit(attribute);
	}, []);

	const handleStartCopy = useCallback((attribute: AttributeDefinition) => {
		drawerRef.current?.copy(attribute);
	}, []);

	const handleDelete = useCallback(
		(attribute: AttributeDefinition) => {
			onAttributesChange((prev) => prev.filter((item) => item.id !== attribute.id));
			message.success(`已删除属性：${attribute.key}`);
		},
		[message, onAttributesChange],
	);

	const handleFinishCreate = useCallback(
		(values: AttributeDefinition): boolean => {
			onAttributesChange((prev) => [...prev, values]);
			message.success("属性已创建");
			resetPage();
			return true;
		},
		[message, onAttributesChange, resetPage],
	);

	const handleFinishEdit = useCallback(
		(values: AttributeDefinition): boolean => {
			onAttributesChange((prev) => prev.map((item) => (item.id === values.id ? values : item)));
			message.success("属性已保存");
			return true;
		},
		[message, onAttributesChange],
	);

	return (
		<section className={style.attributePage}>
			<div className={style.toolbar}>
				<span className={style.summary}>共 {attributes.length} 个属性</span>
				<Button type="primary" icon={<PlusOutlined />} onClick={handleStartCreate}>
					新建属性
				</Button>
			</div>

			<AttributeTable
				attributes={pagedAttributes}
				total={total}
				currentPage={currentPage}
				pageSize={pageSize}
				onPageChange={handlePageChange}
				onEdit={handleStartEdit}
				onCopy={handleStartCopy}
				onDelete={handleDelete}
			/>

			<AttributeDrawer
				ref={drawerRef}
				attributes={attributes}
				nextId={getNextId(attributes)}
				finishCreate={handleFinishCreate}
				finishCopy={handleFinishCreate}
				finishEdit={handleFinishEdit}
			/>
		</section>
	);
});

export default AttributePage;
