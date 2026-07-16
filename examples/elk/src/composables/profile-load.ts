interface HttpLikeError {
  statusCode?: number;
}

function isRetriableProfileError(error: unknown): boolean {
  const statusCode = (error as HttpLikeError | null)?.statusCode;
  if (typeof statusCode !== 'number')
    return true;
  return statusCode === 408 || statusCode === 429 || statusCode >= 500;
}

export async function retryProfileRequest<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  }
  catch (error) {
    if (!isRetriableProfileError(error))
      throw error;
    await new Promise(resolve => setTimeout(resolve, 150));
    return request();
  }
}

export async function recoverProfileRequest<T>(
  request: Promise<T>,
  onRejected: () => void,
): Promise<T> {
  try {
    return await request;
  }
  catch (error) {
    onRejected();
    throw error;
  }
}

export function createProfileLoadGuard() {
  let latest = 0;
  return {
    begin() {
      return ++latest;
    },
    isCurrent(request: number | undefined) {
      return request === latest;
    },
  };
}
