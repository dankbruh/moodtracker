import { getIdToken } from "./cognito";
import { AppEvent, Settings } from "./types";

const API_URL = "https://moodtracker.link/api";
const EVENTS_URL = `${API_URL}/events`;
const SETTINGS_URL = `${API_URL}/settings`;
const WEEKLY_EMAILS_URL = `${API_URL}/weekly-emails`;

const fetchWithAuth: typeof fetch = async (
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> => {
  const idToken = await getIdToken();
  return fetch(input, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${idToken.getJwtToken()}`,
    },
  });
};

export const eventsGet = async (
  cursor?: string
): Promise<{
  events: AppEvent[];
  hasNextPage: boolean;
  nextCursor: string;
}> => {
  const response = await fetchWithAuth(
    cursor ? `${EVENTS_URL}/?cursor=${encodeURIComponent(cursor)}` : EVENTS_URL
  );
  if (!response.ok) throw Error(String(response.status));
  return response.json();
};
export const eventsPost = async (events: AppEvent[]): Promise<void> => {
  const response = await fetchWithAuth(EVENTS_URL, {
    body: JSON.stringify(events),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) throw Error(String(response.status));
};

export const weeklyEmailsGet = async (): Promise<boolean> => {
  const response = await fetchWithAuth(WEEKLY_EMAILS_URL);
  if (response.status === 404) return false;
  if (!response.ok) throw Error(String(response.status));
  return true;
};
export const weeklyEmailsDisable = async (): Promise<void> => {
  const response = await fetchWithAuth(WEEKLY_EMAILS_URL, {
    method: "DELETE",
  });
  if (!response.ok) throw Error(String(response.status));
};
export const weeklyEmailsEnable = async (): Promise<void> => {
  const response = await fetchWithAuth(WEEKLY_EMAILS_URL, {
    method: "POST",
  });
  if (!response.ok) throw Error(String(response.status));
};

export const settingsGet = async (): Promise<Settings | undefined> => {
  const response = await fetchWithAuth(SETTINGS_URL);
  if (response.status === 404) return undefined;
  if (!response.ok) throw Error(String(response.status));
  const settings = await response.json();
  return settings;
};
export const settingsSet = async (settings: Settings): Promise<void> => {
  const response = await fetchWithAuth(SETTINGS_URL, {
    method: "PUT",
    body: JSON.stringify(settings),
  });
  if (!response.ok) throw Error(String(response.status));
};
