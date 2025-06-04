import { QueryClient } from "@tanstack/react-query";


declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  }
}


const isCapacitorNative = () => {
  try {
    return window?.Capacitor?.isNativePlatform?.() || false;
  } catch {
    return false;
  }
};

export const getApiBaseUrl = () => {
  if (isCapacitorNative()) {
    return 'http://192.168.0.229:5000';
  }
  return window.location.origin;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      }
    }
  }
});


export function getQueryFn(options?: { on401?: "returnNull" }) {
  return async (context: { queryKey: readonly string[] }) => {
    const path = context.queryKey[0];

    try {
      return await apiRequest("GET", path);
    } catch (error: any) {
      if (error?.status === 401 && options?.on401 === "returnNull") {
        return null;
      }
      throw error;
    }
  };
}

export async function apiRequest<T = any>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: any,
  skipAutoError?: boolean
): Promise<T> {
  const baseURL = getApiBaseUrl();
  const url = `${baseURL}${path}`;

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });

    if (skipAutoError) {
      return response as any;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      const error = new Error(errorData.message || `HTTP ${response.status}`) as any;
      error.status = response.status;
      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return {} as T;
  } catch (error: any) {
    console.error('API Request Error:', error);

    if (!error.status && error.message.includes('HTTP')) {
      const statusMatch = error.message.match(/HTTP (\d+)/);
      if (statusMatch) {
        error.status = parseInt(statusMatch[1]);
      }
    }

    throw error;
  }
}