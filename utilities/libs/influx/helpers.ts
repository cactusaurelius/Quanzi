export function tagsToString(tags: { [name: string]: string }): string {
  return `|> filter(fn: (r) =>${Object.entries(tags)
    .map(([key, val]) => `r["${key}"] == "${val}"`)
    .join(' and ')})`;
}
