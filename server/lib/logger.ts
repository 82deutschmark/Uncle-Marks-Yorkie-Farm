export function log(message: string, error?: unknown) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (error) {
    console.error(`[${timestamp}] Error details:`, error);
  }
}
