/**
 * WCAG 2.x contrast maths, pure and dependency-free.
 *
 * The ratios written beside the colour values in this package were all
 * computed this way; exporting it lets the tests, the derivation script and the
 * apps' own contrast tests measure with one formula instead of three copies.
 *
 * Opaque `#RRGGBB` only. A translucent colour has no contrast of its own — it
 * depends on what is under it — so `rgba()`, `transparent` and shorthand hex
 * throw instead of returning a number that looks right and isn't.
 */

const OPAQUE_HEX = /^#[0-9A-Fa-f]{6}$/;

function channels(hex: string, caller: string): [number, number, number] {
  if (!OPAQUE_HEX.test(hex)) {
    throw new Error(`${caller}: "${hex}" is not an opaque #RRGGBB colour`);
  }
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function relativeLuminance(hex: string, caller: string): number {
  const [r, g, b] = channels(hex, caller).map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The WCAG contrast ratio of two opaque colours, 1 to 21. Order doesn't matter. */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground, 'contrastRatio');
  const b = relativeLuminance(background, 'contrastRatio');
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * `foreground` at `alpha` laid over `background`, as the opaque colour the eye
 * sees. Dark tints are stored this way so a contrast check against them is
 * exact and Android elevation never stacks a second alpha on top.
 */
export function compositeOver(foreground: string, alpha: number, background: string): string {
  const fg = channels(foreground, 'compositeOver');
  const bg = channels(background, 'compositeOver');
  return (
    '#' +
    fg
      .map((value, i) => Math.round(value * alpha + bg[i] * (1 - alpha)))
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}
