import { del, get, set } from "idb-keyval";
import { EventsStateToStore } from "./store/eventsSlice";
import { UserDetails } from "./store/userSlice";
import { Settings } from "./types";

const USER_KEY = "moodtracker:user";

const makeEventsKey = (userId: string): string =>
  `moodtracker:${userId}:events`;
const makeSettingsKey = (userId: string): string =>
  `moodtracker:${userId}:settings`;

export default {
  // events
  deleteEvents: (userId: string): Promise<void> => del(makeEventsKey(userId)),
  getEvents: (userId: string): Promise<EventsStateToStore | undefined> =>
    get<EventsStateToStore | undefined>(makeEventsKey(userId)),
  setEvents: (userId: string, events: EventsStateToStore): Promise<void> =>
    set(makeEventsKey(userId), events),

  // settings
  deleteSettings: (userId: string): Promise<void> =>
    del(makeSettingsKey(userId)),
  getSettings: (userId: string): Promise<Settings | undefined> =>
    get<Settings | undefined>(makeSettingsKey(userId)),
  setSettings: (userId: string, settings: Settings): Promise<void> =>
    set(makeSettingsKey(userId), settings),

  // user
  deleteUser: (): Promise<void> => del(USER_KEY),
  getUser: (): Promise<UserDetails | undefined> => get(USER_KEY),
  setUser: (user: UserDetails): Promise<void> => set(USER_KEY, user),
};
