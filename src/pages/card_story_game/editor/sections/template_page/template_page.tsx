import { EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Pagination, Table } from "antd";
import type { TableColumnsType } from "antd";
import { useCallback, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import type { CardTemplate } from "../../../card_story_game_types.ts";
import EllipsisText from "../../../../../components/ellipsis_text/ellipsis_text.tsx";
import { formatDateTime } from "../../../../../utils/date_time.ts";
import { PAGE_SIZE_OPTIONS, useClientPagination } from "../../../../../hooks/use_client_pagination.ts";
import { compareByCreatedAtDesc } from "../../utils/sort.ts";

import TemplateDrawer, { type TemplateDrawerHandle } from "./template_drawer/template_drawer.tsx";

import style from "./template_page.module.scss";

interface TemplatePageProps {
	templates: CardTemplate[];
}

export default function TemplatePage({ templates }: TemplatePageProps) {
	const [keyword, setKeyword] = useState("");
	const drawerRef = useRef<TemplateDrawerHandle>(null);

	const sortedTemplates = useMemo(() => {
		return [...templates].sort(compareByCreatedAtDesc);
	}, [templates]);

	const filteredTemplates = useMemo(() => {
		const normalized = keyword.trim().toLowerCase();
		if (normalized === "") {
			return sortedTemplates;
		}
		const filtered: CardTemplate[] = [];
		for (let i = 0; i < sortedTemplates.length; i++) {
			const template = sortedTemplates[i];
			if (template.key.toLowerCase().includes(normalized) || template.desc.toLowerCase().includes(normalized)) {
				filtered.push(template);
			}
		}
		return filtered;
	}, [sortedTemplates, keyword]);

	const {
		total,
		pageSize,
		currentPage,
		pagedItems: pagedTemplates,
		handlePageChange,
		resetPage,
	} = useClientPagination(filteredTemplates);

	const handleSearchChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			setKeyword(event.target.value);
			resetPage();
		},
		[resetPage],
	);

	const handleCreate = useCallback(() => {
		drawerRef.current?.create();
	}, []);

	const handleEdit = useCallback((template: CardTemplate) => {
		drawerRef.current?.edit(template);
	}, []);

	const showTotal = useCallback((totalCount: number) => `共 ${totalCount} 条`, []);

	const columns: TableColumnsType<CardTemplate> = useMemo(() => {
		return [
			{
				title: "ID",
				dataIndex: "id",
				width: 80,
				render: (id: number) => <span className={style.templateId}>#{id}</span>,
			},
			{
				title: "模板 key",
				dataIndex: "key",
				width: 180,
				render: (key: string) => <span className={style.templateKey}>{key.trim() || "未命名"}</span>,
			},
			{
				title: "描述",
				dataIndex: "desc",
				width: 240,
				ellipsis: true,
				render: (desc: string) =>
					desc ? <EllipsisText text={desc} /> : <span className={style.emptyDesc}>—</span>,
			},
			{
				title: "标签数",
				dataIndex: "tags",
				width: 90,
				render: (tags: number[]) => <span className={style.count}>{tags.length}</span>,
			},
			{
				title: "自动规则",
				key: "auto",
				width: 90,
				render: (_, template) => <span className={style.count}>{template.auto.length}</span>,
			},
			{
				title: "主动规则",
				key: "outgoing",
				width: 90,
				render: (_, template) => <span className={style.count}>{template.outgoing.length}</span>,
			},
			{
				title: "响应规则",
				key: "incoming",
				width: 90,
				render: (_, template) => <span className={style.count}>{template.incoming.length}</span>,
			},
			{
				title: "创建时间",
				dataIndex: "createdAt",
				width: 180,
				render: (createdAt: number) => <span className={style.createdAt}>{formatDateTime(createdAt)}</span>,
			},
			{
				title: "操作",
				key: "actions",
				width: 100,
				fixed: "end",
				render: (_, template) => (
					<Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(template)}>
						编辑
					</Button>
				),
			},
		];
	}, [handleEdit]);

	return (
		<section className={style.templatePage}>
			<div className={style.toolbar}>
				<Input
					className={style.search}
					allowClear
					prefix={<SearchOutlined />}
					placeholder="搜索模板 key / 描述"
					value={keyword}
					onChange={handleSearchChange}
					aria-label="搜索模板"
				/>
				<Button className={style.createButton} type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
					新建模板
				</Button>
			</div>

			<div className={style.tableCard}>
				<div className={style.tableWrap}>
					<Table<CardTemplate>
						rowKey="id"
						columns={columns}
						dataSource={pagedTemplates}
						pagination={false}
						size="middle"
						locale={{ emptyText: "暂无模板" }}
						sticky
						scroll={{ x: "max-content" }}
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
						onChange={handlePageChange}
					/>
				</div>
			</div>

			<TemplateDrawer ref={drawerRef} />
		</section>
	);
}
