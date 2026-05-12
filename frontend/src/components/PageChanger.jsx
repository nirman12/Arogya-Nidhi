const getVisiblePages = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);

  if (left > 2) pages.push("...");
  for (let page = left; page <= right; page += 1) pages.push(page);
  if (right < totalPages - 1) pages.push("...");
  pages.push(totalPages);

  return pages;
};

const PageChanger = ({ currentPage, totalPages, onPageChange, className = "" }) => {
  if (totalPages <= 1) return null;

  const goToPage = (page) => {
    onPageChange(Math.max(1, Math.min(totalPages, page)));
  };

  return (
    <nav
      className={`mt-8 flex flex-wrap items-center justify-center gap-2 ${className}`}
      aria-label="Pagination"
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => goToPage(currentPage - 1)}
        className={`min-w-[96px] rounded-full border-2 px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-5 ${
          currentPage <= 1
            ? "opacity-40 cursor-not-allowed border-gray-200 text-gray-400 bg-white"
            : "border-gray-300 text-gray-700 bg-white hover:border-primary hover:text-primary"
        }`}
      >
        &larr; Prev
      </button>

      <div className="flex flex-wrap items-center justify-center gap-1">
        {getVisiblePages(currentPage, totalPages).map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="px-2 text-sm font-medium text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => goToPage(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`h-8 w-8 rounded-full text-sm font-medium transition-all duration-200 sm:h-9 sm:w-9 ${
                page === currentPage
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-500 hover:bg-primary/10 hover:text-primary"
              }`}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => goToPage(currentPage + 1)}
        className={`min-w-[96px] rounded-full border-2 px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-5 ${
          currentPage >= totalPages
            ? "opacity-40 cursor-not-allowed border-gray-200 text-gray-400 bg-white"
            : "border-gray-300 text-gray-700 bg-white hover:border-primary hover:text-primary"
        }`}
      >
        Next &rarr;
      </button>
    </nav>
  );
};

export default PageChanger;
