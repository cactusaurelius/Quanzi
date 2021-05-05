export function tagsToString(tags: { [name: string]: string }): string {
  return Object.entries(tags)
    .map(([key, val]) => `|> filter(fn: (r) => r["${key}"] == "${val}")`)
    .join('');
}
