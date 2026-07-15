export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  page: number;
  num_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ApiError {
  error: string;
}

export interface Message {
  message: string;
  tags: "success" | "error" | "warning" | "info";
}
