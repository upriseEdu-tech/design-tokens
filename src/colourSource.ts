import { Roles } from './roles.js';
import type { ColorScheme, RoleName } from './roles.js';

/**
 * Where a screen-named token gets its colour in each scheme (dark-mode spec
 * 2026-10-26):
 * - a role name: that role, in both schemes;
 * - `{ light, dark }`: a light value that is deliberately its own (an accent
 *   no role covers) and a role for dark. A dark side is always a role, never
 *   a new hex;
 * - `{ same }`: a brand accent that reads the same on light and dark (the
 *   translucent lavender borders, `transparent`).
 */
export type ColourSource = RoleName | { readonly light: string; readonly dark: RoleName } | { readonly same: string };

/** A token definition: numbers pass through, everything else is a colour source or a nested group. */
export type TokenDefinition = { readonly [key: string]: number | ColourSource | TokenDefinition };

export type ResolvedTokens<T> = {
  readonly [K in keyof T]: T[K] extends number ? T[K] : T[K] extends ColourSource ? string : ResolvedTokens<T[K]>;
};

export type ColourSourceTree = { readonly [key: string]: ColourSource | ColourSourceTree };

const isColourSource = (value: object): value is Exclude<ColourSource, string> => 'light' in value || 'same' in value;

export function resolveColour(source: ColourSource, scheme: ColorScheme): string {
  if (typeof source === 'string') return Roles[scheme][source];
  if ('same' in source) return source.same;
  return scheme === 'light' ? source.light : Roles.dark[source.dark];
}

/** Resolves every colour in `definition` for `scheme`, keeping its key order and nesting. */
export function resolveTokens<T extends TokenDefinition>(definition: T, scheme: ColorScheme): ResolvedTokens<T> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(definition)) {
    if (typeof value === 'number') out[key] = value;
    else if (typeof value === 'string' || isColourSource(value)) out[key] = resolveColour(value, scheme);
    else out[key] = resolveTokens(value, scheme);
  }
  return out as ResolvedTokens<T>;
}

/** The colour keys of `definition` and their sources, numbers dropped. */
export function colourSourcesOf(definition: TokenDefinition): ColourSourceTree {
  const out: Record<string, ColourSource | ColourSourceTree> = {};
  for (const [key, value] of Object.entries(definition)) {
    if (typeof value === 'number') continue;
    out[key] = typeof value === 'string' || isColourSource(value) ? value : colourSourcesOf(value);
  }
  return out;
}
