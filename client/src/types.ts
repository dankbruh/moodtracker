export type FluxStandardAction<
  Type extends string,
  Payload = undefined
> = Payload extends undefined
  ? { type: Type }
  : { payload: Payload; type: Type };

export interface NormalizedEvents {
  allIds: string[];
  byId: { [id: string]: AppEvent };
  idsToSync: string[];
  nextCursor: string | undefined;
}

export interface Mood {
  mood: number;
}

type MoodEvent<Type extends string, Payload> = {
  createdAt: string;
  payload: Payload;
  type: Type;
};

export type AppEvent =
  | MoodEvent<"v1/moods/create", Mood>
  | MoodEvent<"v1/moods/delete", string>
  | MoodEvent<"v1/moods/update", Mood & { id: string }>;
