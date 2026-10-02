/** Fills `{name}` slots in authored text. Unknown slots are left visible so authors notice them. */
export type TemplateVars = Record<string, string | number>;

export function fill(text: string, vars: TemplateVars = {}): string {
  return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}
