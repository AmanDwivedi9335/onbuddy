export function serializeDocument<T extends { _id?: unknown }>(doc: T): Omit<T, "_id"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...rest } = doc;
  return rest;
}

export function serializeMany<T extends { _id?: unknown }>(docs: T[]): Array<Omit<T, "_id">> {
  return docs.map(serializeDocument);
}
