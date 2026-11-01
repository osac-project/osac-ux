/**
 * Well-known annotation keys for Secret resources.
 *
 * NOTE: `SOURCE_FILENAME_ANNOTATION` is a predicted field — the backend is expected to persist
 * the original filename in this annotation when a file is uploaded. Until the API is updated,
 * the create payload sets it client-side and the details page reads it from here.
 */
export const SOURCE_FILENAME_ANNOTATION = 'osac.io/source-filename';

/**
 * Mock annotation data for development / demo purposes.
 * Remove once the real API starts returning this annotation.
 */
export const MOCK_SOURCE_FILE_ANNOTATIONS: Record<string, string> = {
  [SOURCE_FILENAME_ANNOTATION]: 'my-kubeconfig.yaml',
};
