type PaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
};

function Pagination({
  page,
  totalPages,
  totalCount,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return totalCount > 0 ? (
      <div className="pagination">
        <span>{totalCount} total</span>
      </div>
    ) : null;
  }

  return (
    <div className="pagination">
      <span>
        Page {page} of {totalPages} · {totalCount} total
      </span>
      <div className="pagination-actions">
        <button
          type="button"
          className="secondary-button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;
