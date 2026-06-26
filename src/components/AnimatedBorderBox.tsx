import * as React from 'react';
import { Box } from '@anthropic/ink';
import type { Theme } from '../utils/theme.js';
import { useBreath, useShimmerSweep } from '../hooks/useMicroAnimations.js';

type Props = {
  children: React.ReactNode;
  /** Theme color key for static rendering */
  themeColor?: keyof Theme;
  /** When true, animates the border with a gradient sweep */
  gradientAnimated?: boolean;
  /** Color to use as the base of the gradient animation */
  gradientBase?: string;
  /** Color to use as the peak of the gradient animation */
  gradientPeak?: string;
  /** Animation cycle duration in ms */
  cycleMs?: number;
  /** Box border style props */
  borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic';
  borderLeft?: boolean;
  borderRight?: boolean;
  borderTop?: boolean;
  borderBottom?: boolean;
  width?: string | number;
};

/**
 * A Box with an animatable border that supports gradient color cycling.
 * Uses raw RGB color strings which Ink's renderer handles natively.
 */
export function AnimatedBorderBox({
  children,
  themeColor = 'promptBorder',
  gradientAnimated = false,
  gradientBase = 'rgb(74,108,247)',
  gradientPeak = 'rgb(114,148,255)',
  cycleMs = 2000,
  borderStyle = 'round',
  borderLeft = true,
  borderRight = true,
  borderTop = true,
  borderBottom = true,
  width = '100%',
}: Props): React.ReactNode {
  const breath = useBreath(gradientAnimated, cycleMs);
  const sweep = useShimmerSweep(gradientAnimated, 3000);

  // For gradient animation, interpolate between base and peak colors
  // using a sine wave for smooth transition
  if (gradientAnimated) {
    const rgbBase = parseColor(gradientBase);
    const rgbPeak = parseColor(gradientPeak);

    if (rgbBase && rgbPeak) {
      // Smooth blend between colors with a slow sweep
      const t = (Math.sin(sweep * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      const r = Math.round(rgbBase.r + (rgbPeak.r - rgbBase.r) * t);
      const g = Math.round(rgbBase.g + (rgbPeak.g - rgbBase.g) * t);
      const b = Math.round(rgbBase.b + (rgbPeak.b - rgbBase.b) * t);
      const animatedColor = `rgb(${r},${g},${b})` as any;

      return (
        <Box
          borderStyle={borderStyle}
          borderColor={animatedColor}
          borderLeft={borderLeft}
          borderRight={borderRight}
          borderTop={borderTop}
          borderBottom={borderBottom}
          width={width}
        >
          {children}
        </Box>
      );
    }
  }

  // Static rendering with theme key
  return (
    <Box
      borderStyle={borderStyle}
      borderColor={themeColor}
      borderLeft={borderLeft}
      borderRight={borderRight}
      borderTop={borderTop}
      borderBottom={borderBottom}
      width={width}
    >
      {children}
    </Box>
  );
}

function parseColor(color: string): { r: number; g: number; b: number } | null {
  const match = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (!match) return null;
  return {
    r: parseInt(match[1]!, 10),
    g: parseInt(match[2]!, 10),
    b: parseInt(match[3]!, 10),
  };
}
