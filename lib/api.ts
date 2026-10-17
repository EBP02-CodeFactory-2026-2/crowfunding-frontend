import { ApiError } from "@/types";
import { getToken } from "@/lib/auth";

const HOST = "https://crowfunding-backend.onrender.com";
const PREFIX = "/api/v1";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const path = endpoint.startsWith(PREFIX) ? endpoint : `${PREFIX}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };


  const token =
    getToken() ??
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  if (token && (auth || endpoint.includes("projects"))) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${HOST}${path}`, { ...options, headers });
  } catch {
    throw { message: "No se pudo conectar con el servidor." } as ApiError;
  }

  if (!response.ok) {
    let body: any = null;
    try { body = await response.json(); } catch {}
    console.error(`[API] ${options.method ?? "GET"} ${HOST}${path} -> ${response.status}`, body);
    throw { message: `Error ${response.status} del servidor`, ...body, status: response.status } as ApiError;
  }

  if (response.status === 204) return {} as T;
  return response.json();
}