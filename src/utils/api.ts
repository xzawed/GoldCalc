export async function apiFetch<T>(url: string, headers?: HeadersInit): Promise<T> {
  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}
