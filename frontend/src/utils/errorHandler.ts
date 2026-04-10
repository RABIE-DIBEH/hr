import axios from 'axios';

export interface ApiErrorDetails {
  message: string;
  fieldErrors?: Record<string, string>;
  /** Backend {@link ErrorResponse#error} when present */
  errorCode?: string;
}

export const extractApiError = (err: unknown): ApiErrorDetails => {
  if (axios.isAxiosError(err)) {
    const payload = err.response?.data as
      | { message?: string; errors?: Record<string, string>; error?: string }
      | undefined;

    return {
      message: payload?.message || err.message || 'Unexpected request error.',
      fieldErrors: payload?.errors,
      errorCode: payload?.error,
    };
  }

  if (err instanceof Error) {
    return { message: err.message };
  }

  return { message: 'An unexpected error occurred.' };
};
