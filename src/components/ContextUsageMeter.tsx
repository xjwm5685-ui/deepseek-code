import * as React from 'react';
import { Box, Text, stringWidth } from '@anthropic/ink';
import { useBreath } from '../hooks/useMicroAnimations.js';

type Props = {
  /** Tokens used */
  used: number;
  /** Context window limit */
  limit: number;
  /** Whether to show the bar visually */
  showBar?: boolean;
  /** Width in chars for the bar */
  barWidth?: number;
};

/**
 * A compact context usage indicator for the status bar.
 * Shows a visual bar + percentage of context window used.
 *
 * Color legend:
 *   █ green  (< 50%)  — plenty of room
 *   █ yellow (50-75%) — getting warm
 *   █ red    (> 75%)  — consider compacting
 */
export function ContextUsageMeter({ used, limit, showBar = true, barWidth = 10 }: Props): React.ReactNode {
  const breath = useBreath(true, 2000);

  if (limit <= 0) return null;

  const pct = Math.min(100, Math.round((used / limit) * 100));
  const filled = Math.round((pct / 100) * barWidth);
  const empty = barWidth - filled;

  // Color: green < 50%, yellow 50-75%, red > 75%
  const barColor = pct > 75 ? 'error' : pct > 50 ? 'warning' : 'success';

  // Pulsing when > 80%
  const urgent = pct > 80;
  const dimPulse = urgent ? breath < 0.5 : false;

  const bar = showBar ? `${'█'.repeat(filled)}${'░'.repeat(Math.max(0, empty))}` : '';

  const label = `${pct}%`;

  // Compact: just percentage + subtle bar
  return (
    <Box>
      <Text dimColor={dimPulse}>
        {showBar ? (
          <>
            <Text color={barColor}>{bar}</Text>{' '}
          </>
        ) : null}
        <Text color={pct > 75 ? 'error' : pct > 50 ? 'warning' : undefined}>{label}</Text>
      </Text>
    </Box>
  );
}
