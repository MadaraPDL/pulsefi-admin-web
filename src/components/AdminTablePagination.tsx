const ADMIN_TABLE_QUICK_PAGE_COUNT = 3;

export function AdminTablePagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const safePage = Math.min(page, pageCount);
  const visiblePages = Array.from(
    { length: Math.min(ADMIN_TABLE_QUICK_PAGE_COUNT, pageCount) },
    (_, index) => index + 1
  );

  return (
    <div className="pf-admin-table-pagination">
      <button
        className="pf-page-control-button pf-page-control-button-wide"
        type="button"
        disabled={safePage <= 1}
        onClick={() => onPageChange(Math.max(safePage - 1, 1))}
      >
        Previous
      </button>

      {visiblePages.map((pageNumber) => (
        <button
          key={pageNumber}
          className={
            pageNumber === safePage
              ? "pf-page-control-button pf-page-control-button-active"
              : "pf-page-control-button"
          }
          type="button"
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </button>
      ))}

      <button
        className="pf-page-control-button pf-page-control-button-wide"
        type="button"
        disabled={safePage >= pageCount}
        onClick={() => onPageChange(Math.min(safePage + 1, pageCount))}
      >
        Next
      </button>
    </div>
  );
}
