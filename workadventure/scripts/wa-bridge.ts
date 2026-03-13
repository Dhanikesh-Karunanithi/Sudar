/**
 * SudarPlay — WA ↔ Sudar Intelligence API bridge.
 * All Sudar API calls from WorkAdventure scripts MUST go through this module.
 * Do not use raw fetch() to Sudar from map scripts.
 */

declare const WA: {
  ui: {
    openPopup: (url: string, title: string, size?: unknown[]) => void;
  };
};

/** Sudar Intelligence API base URL. Set at map load or build time. */
const SUDAR_API = "https://api.sudar.app";

/** Extract JWT from map URL query params (e.g. ?token=...) */
export function getLaunchToken(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("token") ?? "";
}

/** POST to Sudar Intelligence API with launch JWT in Authorization header. */
export async function sudarPost(path: string, body: object): Promise<Response> {
  const base = SUDAR_API.replace(/\/$/, "");
  const url = path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getLaunchToken()}`,
    },
    body: JSON.stringify(body),
  });
}

/** Log a learning event (room enter, exit, npc interaction, etc.). */
export async function logEvent(eventType: string, payload: object): Promise<void> {
  await sudarPost("/api/sudarplay/event", { event_type: eventType, payload });
}

/** Open Sudar NPC chat overlay (iframe). */
export function openNPCChat(conceptContext: string, npcName: string): void {
  const url = `${SUDAR_API.replace(/\/$/, "")}/sudarplay/npc-overlay?ctx=${encodeURIComponent(conceptContext)}&name=${encodeURIComponent(npcName)}&token=${getLaunchToken()}`;
  WA.ui.openPopup(url, npcName, []);
}

/** Result of quiz gate evaluation. */
export interface QuizGateResult {
  passed: boolean;
  score: number;
}

/** Evaluate a quiz gate; returns passed and score. */
export async function evaluateQuiz(
  gateId: string,
  answers: object[]
): Promise<QuizGateResult> {
  const res = await sudarPost("/api/sudarplay/quiz-gate", {
    gate_id: gateId,
    answers,
  });
  return res.json() as Promise<QuizGateResult>;
}

/** Result of session complete. */
export interface CompleteResult {
  cert_url: string | null;
}

/** Mark SudarPlay session complete (trophy room). */
export async function completeSession(mapId: string): Promise<CompleteResult> {
  const res = await sudarPost("/api/sudarplay/complete", { map_id: mapId });
  return res.json() as Promise<CompleteResult>;
}
