import Link from 'next/link'

interface Props {
  currentPage: number
  totalPages: number
}

export default function Pagination({ currentPage, totalPages }: Props) {
  if (totalPages <= 1)
    return null;

  const createPageUrl = (page: number) => `/blog/page/${page}`;
  return (
    <nav className="flex justify-center items-center space-x-2 mt-12" aria-label="Pagination">
      {/* Previous Button */}
      {currentPage > 1 && (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="px-4 py-2 rounded-md transition-colors"
          style={{backgroundColor: '#313244', color: '#cdd6f4', border: '1px solid #45475a'}}
        >
          Previous
        </Link>
      )}

      {/* Page Numbers */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          href={createPageUrl(page)}
          className="px-3 py-2 rounded-md transition-colors"
          style={page === currentPage
            ? {backgroundColor: '#89b4fa', color: '#1e1e2e', border: '1px solid #89b4fa', boxShadow: '0 4px 6px -1px rgba(137, 180, 250, 0.2)'}
            : {backgroundColor: '#313244', color: '#cdd6f4', border: '1px solid #45475a'}
          }
        >
          {page}
        </Link>
      ))}

      {/* Next Button */}
      {currentPage < totalPages && (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="px-4 py-2 rounded-md transition-colors"
          style={{backgroundColor: '#313244', color: '#cdd6f4', border: '1px solid #45475a'}}
        >
          Next
        </Link>
      )}
    </nav>
  );
}