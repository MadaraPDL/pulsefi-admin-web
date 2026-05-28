export const ADMIN_TABLE_PAGE_SIZE = 5;

export function getAdminPageCount(
  totalItems: number,
  pageSize = ADMIN_TABLE_PAGE_SIZE
) {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function paginateRows<T>(
  rows: T[],
  page: number,
  pageSize = ADMIN_TABLE_PAGE_SIZE
) {
  const pageCount = getAdminPageCount(rows.length, pageSize);
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;

  return {
    safePage,
    pageCount,
    pageRows: rows.slice(start, start + pageSize),
  };
}
