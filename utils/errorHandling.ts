export function handleApiError<T>(data: T | null, error: Error | null): { data: T | null, error: Error | null } {
  return { data, error };
}
