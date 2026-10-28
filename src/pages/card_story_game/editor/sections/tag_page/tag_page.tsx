import { useCallback, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Pagination, Table } from "antd";
import type { TableColumnsType } from "antd";

import type { TagItem } from "../../../card_story_game_types.ts";
import EllipsisText from "../../../../../components/ellipsis_text/ellipsis_text.tsx";
import { formatDateTime } from "../../../../../utils/date_time.ts";

import TagDrawer, { type TagDrawerHandle } from "./tag_drawer/tag_drawer.tsx";

import style from "./tag_page.module.scss";

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

interface TagPageProps {
	tags: TagItem[];
	onTagsChange: (updater: (prev: TagItem[]) => TagItem[]) => void;
}

export default function TagPage({ tags, onTagsChange }: TagPageProps) {
	const [keyword, setKeyword] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const drawerRef = useRef<TagDrawerHandle>(null);

	const sortedTags = useMemo(() => {
		return [...tags].sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
	}, [tags]);

	const filteredTags = useMemo(() => {
		const normalized = keyword.trim().toLowerCase();
		if (normalized === "") {
			return sortedTags;
		}
		return sortedTags.filter((tag) => {
			return tag.key.toLowerCase().includes(normalized) || tag.desc.toLowerCase().includes(normalized);
		});
	}, [sortedTags, keyword]);

	const total = useMemo(() => filteredTags.length, [filteredTags]);
	const maxPage = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
	const currentPage = useMemo(() => Math.min(page, maxPage), [page, maxPage]);
	const pagedTags = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredTags.slice(start, start + pageSize);
	}, [filteredTags, currentPage, pageSize]);

	const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setKeyword(event.target.value);
		setPage(1);
	}, []);

	const handleAfterCreate = useCallback(
		(values: Pick<TagItem, "key" | "desc">) => {
			const createdAt = Date.now();
			onTagsChange((prev) => {
				let maxId = 0;
				for (let i = 0; i < prev.length; i++) {
					if (prev[i].id > maxId) {
						maxId = prev[i].id;
					}
				}
				return [...prev, { id: maxId + 1, ...values, createdAt }];
			});
			setPage(1);
			setKeyword("");
		},
		[onTagsChange],
	);

	const handleAfterEdit = useCallback(
		(values: Pick<TagItem, "key" | "desc">, tag: TagItem) => {
			onTagsChange((prev) => {
				const next: TagItem[] = [];
				for (let i = 0; i < prev.length; i++) {
					const item = prev[i];
					next.push(item.id === tag.id ? { ...item, ...values } : item);
				}
				return next;
			});
		},
		[onTagsChange],
	);

	const handleCreate = useCallback(() => {
		drawerRef.current?.create();
	}, []);

	const handleEdit = useCallback((tag: TagItem) => {
		drawerRef.current?.edit(tag);
	}, []);

	const handlePageChange = useCallback((nextPage: number, nextPageSize: number) => {
		setPage(nextPage);
		setPageSize(nextPageSize);
	}, []);

	const showTotal = useCallback((totalCount: number) => `共 ${totalCount} 条`, []);

	const columns: TableColumnsType<TagItem> = useMemo(() => {
		return [
			{
				title: "ID",
				dataIndex: "id",
				width: 80,
				render: (id: number) => <span className={style.tagId}>#{id}</span>,
			},
			{
				title: "标签 key",
				dataIndex: "key",
				width: 180,
				render: (key: string) => <span className={style.tagKey}>{key.trim() || "未命名"}</span>,
			},
			{
				title: "描述",
				dataIndex: "desc",
				width: 300,
				ellipsis: true,
				render: (desc: string) => (desc ? <EllipsisText text={desc} /> : <span className={style.emptyDesc}>—</span>),
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
				render: (_, tag) => (
					<Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(tag)}>
						编辑
					</Button>
				),
			},
		];
	}, [handleEdit]);

	return (
		<section className={style.tagPage}>
			<div className={style.toolbar}>
				<Input
					className={style.search}
					allowClear
					prefix={<SearchOutlined />}
					placeholder="搜索标签 key / 描述"
					value={keyword}
					onChange={handleSearchChange}
					aria-label="搜索标签"
				/>
				<Button className={style.createButton} type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
					新建标签
				</Button>
			</div>

			<div className={style.tableCard}>
				<div className={style.tableWrap}>
					<Table<TagItem>
						rowKey="id"
						columns={columns}
						dataSource={pagedTags}
						pagination={false}
						size="middle"
						locale={{ emptyText: "暂无标签" }}
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

			<TagDrawer ref={drawerRef} tags={tags} afterCreate={handleAfterCreate} afterEdit={handleAfterEdit} />
		</section>
	);
}
