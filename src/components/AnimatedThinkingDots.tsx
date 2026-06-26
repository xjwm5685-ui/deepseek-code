import * as React from 'react';
import { Text } from '@anthropic/ink';
import { useWaveOffset } from '../hooks/useMicroAnimations.js';

const DOT_CHARS = ['·', '∙', '•', '●'];

/**
 * Three dots with a sequential wave animation — each dot lights up in sequence
 * creating a ripple effect. More visually interesting than a simple frame counter.
 */
export function AnimatedThinkingDots({
  animated = true,
  dotCount = 3,
}: {
  animated?: boolean;
  dotCount?: number;
}): React.ReactNode {
  return (
    <Text>
      {Array.from({ length: dotCount }, (_, i) => (
        <AnimatedDot key={i} index={i} total={dotCount} animated={animated} />
      ))}
    </Text>
  );
}

function AnimatedDot({ index, total, animated }: { index: number; total: number; animated: boolean }): React.ReactNode {
  const wave = useWaveOffset(animated, index, total, 1200);

  // Map wave position (0-1) to both size and brightness
  const charIndex = Math.floor(wave * (DOT_CHARS.length - 1));
  const char = DOT_CHARS[Math.min(charIndex, DOT_CHARS.length - 1)];
  const dim = wave < 0.3;

  return <Text dimColor={dim}>{char} </Text>;
}
