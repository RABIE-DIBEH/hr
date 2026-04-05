package com.hrms.api.dto;

import java.util.List;

/**
 * Standard wrapper for paginated list responses.
 */
public record PaginatedResponse<T>(
        List<T> items,
        long totalCount,
        int page,
        int pageSize,
        int totalPages,
        boolean hasNext
) {
    public static <T> PaginatedResponse<T> of(List<T> items, long totalCount, int page, int pageSize) {
        int totalPages = (int) Math.ceil((double) totalCount / pageSize);
        boolean hasNext = page < totalPages - 1;
        return new PaginatedResponse<>(items, totalCount, page, pageSize, totalPages, hasNext);
    }
}
