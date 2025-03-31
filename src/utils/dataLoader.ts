
/**
 * Data loading and pagination utilities for handling large datasets
 */
interface PaginationResult<T> {
  items: T[];
  totalPages: number;
  totalItems: number;
}

/**
 * Creates a paginated subset of data
 * @param data The complete dataset
 * @param page Current page number (1-indexed)
 * @param pageSize Number of items per page
 */
export function paginateData<T>(data: T[], page: number = 1, pageSize: number = 10): PaginationResult<T> {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const totalPages = Math.ceil(data.length / pageSize);
  
  return {
    items: data.slice(startIndex, endIndex),
    totalPages: totalPages,
    totalItems: data.length
  };
}

/**
 * Processes data in chunks to avoid UI freezing with large datasets
 * @param data The dataset to process
 * @param processFunction Function to apply to each item
 * @param chunkSize Size of each chunk to process
 * @param onProgress Callback for progress updates
 */
export async function processDataInChunks<T, R>(
  data: T[],
  processFunction: (item: T) => R,
  chunkSize: number = 1000,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const result: R[] = [];
  let processedItems = 0;
  const totalItems = data.length;
  
  // Process in chunks
  for (let i = 0; i < totalItems; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    
    // Use setTimeout to give the UI a chance to update
    await new Promise<void>(resolve => {
      setTimeout(() => {
        chunk.forEach(item => {
          result.push(processFunction(item));
          processedItems++;
        });
        
        if (onProgress) {
          onProgress(processedItems, totalItems);
        }
        
        resolve();
      }, 0);
    });
  }
  
  return result;
}
