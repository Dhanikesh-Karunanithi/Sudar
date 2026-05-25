export async function bearerPost(
  baseUrl: string,
  path: string,
  accessToken: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; text: string }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, text }
}

export async function bearerGet(
  baseUrl: string,
  path: string,
  accessToken: string,
): Promise<{ ok: boolean; status: number; text: string }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, text }
}

export function parseJsonResponse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { raw: text }
  }
}
