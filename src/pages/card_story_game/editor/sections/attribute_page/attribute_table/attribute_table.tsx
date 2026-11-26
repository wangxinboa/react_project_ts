import { memo, useCallback, useMemo } from "react";
import { Button, Pagination, Popconfirm, Space, Table, Tag } from "antd";
import type { TableColumnsType } from "antd";
import { CopyOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";

import type { AttributeDefinition } from "../../../../card_story_game_types/index.ts";
import type { AttributeType } from "../../../../card_story_game_types/index.ts";
import { PAGE_SIZE_OPTIONS } from "../../../../../../hooks/use_client_pagination.ts";
import { AttributeTypeLabel } from "../attribute_type_meta.ts";
import style from "./attribute_table.module.scss";

interface AttributeTableProps {
	attributes: AttributeDefinition[];
	total: number;
	currentPage: number;
	pageSize: number;
	onPageChange: (page: number, pageSize: number) => void;
	onEdit: (attribute: AttributeDefinition) => void;
	onCopy: (attribute: AttributeDefinition) => void;
	onDelete: (attribute: AttributeDefinition) => void;
}

/** 属性列表表格和分页。 */
const AttributeTable = memo(function AttributeTable({
	attributes,
	total,
	currentPage,
	pageSize,
	onPageChange,
	onEdit,
	onCopy,
	onDelete,
}: AttributeTableProps) {
	const showTotal = useCallback((totalCount: number) => `共 ${totalCount} 条`, []);

	const columns = useMemo<TableColumnsType<AttributeDefinition>>(
		() => [
			{
				title: "ID",
				dataIndex: "id",
				width: 80,
			},
			{
				title: "key",
				dataIndex: "key",
				width: 80,
			},
			{
				title: "label",
				dataIndex: "label",
				width: 120,
				render: (label?: string) => label || "—",
			},
			{
				title: "desc",
				dataIndex: "desc",
				ellipsis: true,
				width: 200,
			},
			{
				title: "type",
				dataIndex: "type",
				width: 80,
				render: (type: AttributeType) => <Tag>{AttributeTypeLabel[type]}</Tag>,
			},
			{
				title: "操作",
				key: "actions",
				width: 220,
				fixed: "right",
				render: (_, attribute) => (
					<Space size={0}>
						<Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(attribute)}>
							编辑
						</Button>
						<Button type="link" size="small" icon={<CopyOutlined />} onClick={() => onCopy(attribute)}>
							复制
						</Button>
						<Popconfirm
							title="确认删除这个属性？"
							description={attribute.key}
							okText="删除"
							cancelText="取消"
							onConfirm={() => onDelete(attribute)}
						>
							<Button type="link" danger size="small" icon={<DeleteOutlined />}>
								删除
							</Button>
						</Popconfirm>
					</Space>
				),
			},
		],
		[onCopy, onDelete, onEdit],
	);

	return (
		<div className={style.tableCard}>
			<div className={style.tableWrap}>
				<Table<AttributeDefinition>
					rowKey="id"
					size="small"
					columns={columns}
					dataSource={attributes}
					pagination={false}
					scroll={{ x: "max-content" }}
					locale={{ emptyText: "暂无属性" }}
				/>
			</div>

			<div className={style.paginationRow}>
				<Pagination
					current={currentPage}
					pageSize={pageSize}
					total={total}
					showSizeChanger
					pageSizeOptions={PAGE_SIZE_OPTIONS}
					showTotal={showTotal}
					onChange={onPageChange}
				/>
			</div>
		</div>
	);
});

export default AttributeTable;
