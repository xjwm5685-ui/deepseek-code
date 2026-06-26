import * as React from 'react';
import { Box, Text } from '@anthropic/ink';
import { useColorPulse, useBreath } from '../hooks/useMicroAnimations.js';
import type { Theme } from '../utils/theme.js';
import { getTheme } from '../utils/theme.js';

type Props = {
  /**
   * The theme color key to animate from (default: the theme's claude color)
   */
  fromColor?: keyof Theme;
  /**
   * The theme color key to animate to
   */
  toColor?: keyof Theme;
  /**
   * Whether the animation is active
   */
  animated?: boolean;
  /**
   * Children to render inside the border
   */
  children: React.ReactNode;
  /**
   * Animation cycle in ms
   */
  cycleMs?: number;
};

/**
 * A wrapper that applies a subtle breathing color pulse to its children.
 * Useful for adding life to borders and status indicators without being distracting.
 */
export function AnimatedPulse({
  fromColor = 'claude',
  toColor = 'claudeShimmer',
  animated = true,
  children,
  cycleMs = 3000,
}: Props): React.ReactNode {
  return (
    <Box>
      <PulseInner fromColor={fromColor} toColor={toColor} animated={animated} cycleMs={cycleMs}>
        {children}
      </PulseInner>
    </Box>
  );
}

function PulseInner({
  fromColor,
  toColor,
  animated,
  children,
  cycleMs,
}: {
  fromColor: keyof Theme;
  toColor: keyof Theme;
  animated: boolean;
  children: React.ReactNode;
  cycleMs: number;
}): React.ReactNode {
  const breath = useBreath(animated, cycleMs);
  const dim = 0.5 + breath * 0.5;

  return <Text dimColor={dim < 0.7}>{children}</Text>;
}

/**
 * A subtle indicator dot that pulses gently to show the system is alive.
 * Attach this to status areas where you want a "heartbeat" feel.
 */
export function LiveDot({ animated = true }: { animated?: boolean }): React.ReactNode {
  const breath = useBreath(animated, 2500);

  // Only show when at peak visibility (top 30% of cycle)
  const visible = breath > 0.35;

  return <Text color="success">{visible ? '●' : '○'}</Text>;
}
