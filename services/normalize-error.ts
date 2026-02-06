export interface NormalizedError {
  message: string;
  code?: string;
  status?: number;
  original?: any;
}

export function normalizeError(err: any): NormalizedError {
  // Axios error structure
  if (err && err.isAxiosError) {
    const response = err.response;
    const message =
      (response &&
        response.data &&
        (response.data.message || response.data.error)) ||
      err.message ||
      "An error occurred";
    const code = (response && response.data && response.data.code) || err.code;
    const status = response && response.status;
    return { message, code, status, original: err };
  }

  // If already normalized
  if (err && err.message && ("status" in err || "code" in err)) {
    return {
      message: err.message,
      code: (err as any).code,
      status: (err as any).status,
      original: err,
    };
  }

  // Generic Error or string
  if (err instanceof Error) {
    return { message: err.message, original: err };
  }

  if (typeof err === "string") {
    return { message: err, original: err };
  }

  return { message: "An unknown error occurred", original: err };
}
