

export interface Pagination {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[],
  page: number,
  totalPages: number,
  hasNextPage: boolean,
  hasPrevPage: boolean,
}

// Returns paginated data, starts at 1.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function paginateData(data: any[], dataPerPage: number, page: number): Pagination {
  const startIndex = (page - 1) * dataPerPage;
  const endIndex = startIndex + dataPerPage;
  const paginatedData = data.slice(startIndex, endIndex);
  const totalPages = Math.ceil(data.length / dataPerPage);

  return {
    data: paginatedData,
    page,
    totalPages,
    hasNextPage: endIndex < data.length,
    hasPrevPage: page > 1
  };
}
