import { useCallback, useMemo, useState } from "react";

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export interface ClientPaginationResult<T> {
	total: number;
	pageSize: number;
	currentPage: number;
	pagedItems: T[];
	handlePageChange: (page: number, pageSize: number) => void;
	resetPage: () => void;
}

/** 前端已拿到全部数据时的分页状态与切片逻辑 */
export function useClientPagination<T>(items: T[], initialPageSize = 50): ClientPaginationResult<T> {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(initialPageSize);

	const total = useMemo(() => items.length, [items]);
	const maxPage = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
	const currentPage = useMemo(() => Math.min(page, maxPage), [page, maxPage]);
	const pagedItems = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return items.slice(start, start + pageSize);
	}, [items, currentPage, pageSize]);

	const handlePageChange = useCallback((nextPage: number, nextPageSize: number) => {
		setPage(nextPage);
		setPageSize(nextPageSize);
	}, []);

	const resetPage = useCallback(() => {
		setPage(1);
	}, []);

	return { total, pageSize, currentPage, pagedItems, handlePageChange, resetPage };
}
