import { EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Pagination, Table } from "antd";
import type { TableColumnsType } from "antd";
import { useCallback, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import type { RuleAction } from "../../../card_story_game_types.ts";
import EllipsisText from "../../../../../components/ellipsis_text/ellipsis_text.tsx";
import { formatDateTime } from "../../../../../utils/date_time.ts";
import { compareByCreatedAtDesc } from "../../utils/sort.ts";
import { PAGE_SIZE_OPTIONS, useClientPagination } from "../../../../../hooks/use_client_pagination.ts";

import ActionDrawer, { type ActionDrawerHandle } from "./action_drawer/action_drawer.tsx";

import style from "./action_page.module.scss";

interface ActionPageProps {
	actions: RuleAction[];
	onActionsChange: (updater: (prev: RuleAction[]) => RuleAction[]) => void;
}

export default function ActionPage({ actions, onActionsChange }: ActionPageProps) {
	const [keyword, setKeyword] = useState("");
	const drawerRef = useRef<ActionDrawerHandle>(null);

	const sortedActions = useMemo(() => {
		return [...actions].sort(compareByCreatedAtDesc);
	}, [actions]);

	const filteredActions = useMemo(() => {
		const normalized = keyword.trim().toLowerCase();
		if (normalized === "") {
			return sortedActions;
		}
		const filtered: RuleAction[] = [];
		for (let i = 0; i < sortedActions.length; i++) {
			const action = sortedActions[i];
			if (action.verb.toLowerCase().includes(normalized) || action.desc.toLowerCase().includes(normalized)) {
				filtered.push(action);
			}
		}
		return filtered;
	}, [sortedActions, keyword]);

	const {
		total,
		pageSize,
		currentPage,
		pagedItems: pagedActions,
		handlePageChange,
		resetPage,
	} = useClientPagination(filteredActions);

	const handleSearchChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			setKeyword(event.target.value);
			resetPage();
		},
		[resetPage],
	);

	const handleAfterCreate = useCallback(
		(values: Omit<RuleAction, "id" | "createdAt">) => {
			const createdAt = Date.now();
			onActionsChange((prev) => {
				let maxId = 0;
				for (let i = 0; i < prev.length; i++) {
					if (prev[i].id > maxId) {
						maxId = prev[i].id;
					}
				}
				return [...prev, { id: maxId + 1, ...values, createdAt }];
			});
			resetPage();
			setKeyword("");
		},
		[onActionsChange, resetPage],
	);

	const handleAfterEdit = useCallback(
		(values: Omit<RuleAction, "id" | "createdAt">, action: RuleAction) => {
			onActionsChange((prev) => {
				const next: RuleAction[] = [];
				for (let i = 0; i < prev.length; i++) {
					const item = prev[i];
					next.push(item.id === action.id ? { ...item, ...values } : item);
				}
				return next;
			});
		},
		[onActionsChange],
	);

	const handleCreate = useCallback(() => {
		drawerRef.current?.create();
	}, []);

	const handleEdit = useCallback((action: RuleAction) => {
		drawerRef.current?.edit(action);
	}, []);

	const showTotal = useCallback((totalCount: number) => `共 ${totalCount} 条`, []);

	const columns: TableColumnsType<RuleAction> = useMemo(() => {
		return [
			{
				title: "ID",
				dataIndex: "id",
				width: 80,
				render: (id: number) => <span className={style.actionId}>#{id}</span>,
			},
			{
				title: "verb",
				dataIndex: "verb",
				width: 180,
				render: (verb: string) => <span className={style.verb}>{verb.trim() || "未命名"}</span>,
			},
			{
				title: "描述",
				dataIndex: "desc",
				width: 220,
				ellipsis: true,
				render: (desc: string) =>
					desc ? <EllipsisText text={desc} /> : <span className={style.emptyDesc}>—</span>,
			},
			{
				title: "参数数",
				dataIndex: "params",
				width: 90,
				render: (params: RuleAction["params"]) => <span className={style.paramCount}>{params.length}</span>,
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
				render: (_, action) => (
					<Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(action)}>
						编辑
					</Button>
				),
			},
		];
	}, [handleEdit]);

	return (
		<section className={style.actionPage}>
			<div className={style.toolbar}>
				<Input
					className={style.search}
					allowClear
					prefix={<SearchOutlined />}
					placeholder="搜索动作 verb / 描述"
					value={keyword}
					onChange={handleSearchChange}
					aria-label="搜索动作"
				/>
				<Button className={style.createButton} type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
					新建动作
				</Button>
			</div>

			<div className={style.tableCard}>
				<div className={style.tableWrap}>
					<Table<RuleAction>
						rowKey="id"
						columns={columns}
						dataSource={pagedActions}
						pagination={false}
						size="middle"
						locale={{ emptyText: "暂无动作" }}
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

			<ActionDrawer ref={drawerRef} afterCreate={handleAfterCreate} afterEdit={handleAfterEdit} />
		</section>
	);
}
