import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

import { MOCK_DATA } from "./mock-data";

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`[DEMO MOCK] ${method} ${url}`, data);
  
  // Return mock success for all requests in demo mode
  return new Response(JSON.stringify({ success: true, message: "Demo mode: Request mocked" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    console.log(`[DEMO MOCK] Fetching: ${url}`);
    
    // Exact match
    if (url in MOCK_DATA) {
      return MOCK_DATA[url];
    }
    
    // Partial match: try finding a key that the url starts with or ends with
    for (const key of Object.keys(MOCK_DATA)) {
      if (url.startsWith(key) || url.endsWith(key.split('/').pop()!)) {
        return MOCK_DATA[key];
      }
    }
    
    // Safe fallback: return empty array for list-like endpoints, empty object otherwise
    console.log(`[DEMO MOCK] No match for ${url}, returning safe default`);
    return {};
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
