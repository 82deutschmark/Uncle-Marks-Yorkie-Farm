
/**
 * Converts a file to a Base64 encoded string
 * @param file The file object to convert
 * @returns Promise resolving to a Base64 encoded string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // The result will include the data URI prefix like "data:image/jpeg;base64,"
      // For raw base64, you might want to strip this prefix
      const base64String = reader.result as string;
      // Return the full string including the prefix
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Extracts the raw Base64 data from a data URI
 * @param dataUri The data URI containing the Base64 data
 * @returns The raw Base64 string without the data URI prefix
 */
export function extractBase64FromDataUri(dataUri: string): string {
  const matches = dataUri.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return matches[2];
  }
  return dataUri; // Return as is if it doesn't match the pattern
}
