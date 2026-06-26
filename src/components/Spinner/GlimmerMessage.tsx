import * as React from 'react';
import { Text, stringWidth, useTheme } from '@anthropic/ink';
import { getGraphemeSegmenter } from '../../utils/intl.js';
import { getTheme, type Theme } from '../../utils/theme.js';
import type { SpinnerMode } from './types.js';
import { interpolateColor, parseRGB, toRGBColor } from './utils.js';

type Props = {
  message: string;
  mode: SpinnerMode;
  messageColor: keyof Theme;
  glimmerIndex: number;
  flashOpacity: number;
  shimmerColor: keyof Theme;
  stalledIntensity?: number;
  appendSpace?: boolean;
};

const ERROR_RED = { r: 171, g: 43, b: 63 };
const GRADIENT_STOPS = [
  { r: 74, g: 108, b: 247 },
  { r: 108, g: 74, b: 247 },
  { r: 247, g: 74, b: 200 },
  { r: 247, g: 120, b: 74 },
  { r: 247, g: 210, b: 74 },
  { r: 74, g: 210, b: 120 },
  { r: 74, g: 180, b: 247 },
  { r: 74, g: 108, b: 247 },
] as const;

function getGradientRGB(position: number): { r: number; g: number; b: number } {
  const idx = Math.max(0, Math.min(position, 1)) * (GRADIENT_STOPS.length - 1);
  const i = Math.floor(idx);
  const f = idx - i;
  const c1 = GRADIENT_STOPS[Math.min(i, GRADIENT_STOPS.length - 1)]!;
  const c2 = GRADIENT_STOPS[Math.min(i + 1, GRADIENT_STOPS.length - 1)]!;
  return interpolateColor(c1, c2, f);
}

export function GlimmerMessage({
  message,
  mode,
  messageColor,
  glimmerIndex,
  flashOpacity,
  shimmerColor,
  stalledIntensity = 0,
  appendSpace = true,
}: Props): React.ReactNode {
  const [themeName] = useTheme();
  const theme = getTheme(themeName);

  // This component re-renders at 20fps (glimmerIndex changes every 50ms) but
  // message is stable within a turn. Precompute grapheme segmentation + widths
  // once per message instead of per frame. Measured -81% on the shimmer path.
  const { segments, messageWidth } = React.useMemo(() => {
    const segs: { segment: string; width: number; start: number; end: number }[] = [];
    let colPos = 0;
    for (const { segment } of getGraphemeSegmenter().segment(message)) {
      const width = stringWidth(segment);
      segs.push({ segment, width, start: colPos, end: colPos + width });
      colPos += width;
    }
    return { segments: segs, messageWidth: stringWidth(message) };
  }, [message]);

  if (!message) return null;

  // When stalled, show text that smoothly transitions to red
  if (stalledIntensity > 0) {
    const baseColorStr = theme[messageColor];
    const baseRGB = baseColorStr ? parseRGB(baseColorStr) : null;

    if (baseRGB) {
      const interpolated = interpolateColor(baseRGB, ERROR_RED, stalledIntensity);
      const color = toRGBColor(interpolated);
      return (
        <>
          <Text color={color}>{message}</Text>
          {appendSpace ? <Text color={color}> </Text> : null}
        </>
      );
    }

    // Fallback for ANSI themes: use messageColor until fully stalled, then error
    const color = stalledIntensity > 0.5 ? 'error' : messageColor;
    return (
      <>
        <Text color={color}>{message}</Text>
        {appendSpace ? <Text color={color}> </Text> : null}
      </>
    );
  }
  const shimmerColorStr = theme[shimmerColor];
  const shimmerRGB = shimmerColorStr ? parseRGB(shimmerColorStr) : null;
  const gradientOffset =
    messageWidth > 0 ? ((((glimmerIndex % messageWidth) + messageWidth) % messageWidth) / messageWidth) % 1 : 0;

  return (
    <>
      {segments.map(({ segment, start, end }, index) => {
        const center = (start + end) / 2;
        const basePosition = messageWidth > 0 ? ((gradientOffset + center / messageWidth) % 1 + 1) % 1 : 0;
        let colorRGB = getGradientRGB(basePosition);

        if (shimmerRGB) {
          if (mode === 'tool-use') {
            colorRGB = interpolateColor(colorRGB, shimmerRGB, flashOpacity);
          } else {
            const distance = Math.abs(center - glimmerIndex);
            if (distance <= 2) {
              const shimmerStrength = 1 - distance / 2;
              colorRGB = interpolateColor(colorRGB, shimmerRGB, shimmerStrength);
            }
          }
        }

        return (
          <Text key={`${segment}-${index}`} color={toRGBColor(colorRGB)}>
            {segment}
          </Text>
        );
      })}
      {appendSpace ? <Text color={messageColor}> </Text> : null}
    </>
  );
}
