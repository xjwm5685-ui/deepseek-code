import * as React from 'react';
import { Box, Text, stringWidth } from '@anthropic/ink';

export type ClawdVariant = 'hero' | 'compact';

const HERO_CLAWD_LINES = [
  '     ⢀  ⡀',
  '⢀⣴⣿⣿⣿⣿⣄⡀⢿⣦⣴⡶',
  '⣿⠉⠛⠻⣿⣿⣟⢿⣦⣿⠉',
  '⢻⣆  ⠈⠻⣿⣶⣿⠏',
  ' ⠻⢷⣤⣿⣦⣝⠿⠷⠄',
  '   ⠈⠉⠉',
] as const;

const COMPACT_CLAWD_LINES = [
  '      ⡀',
  '⣰⣾⣿⣿⣷⣄⢿⣶⠞',
  '⣧ ⠉⠻⣿⣝⣿⠇',
  '⠘⢷⣤⣦⣜⡿⠯',
  '   ⠉',
] as const;

function getArtWidth(lines: readonly string[]): number {
  return Math.max(...lines.map(line => stringWidth(line)));
}

export const HERO_CLAWD_WIDTH = getArtWidth(HERO_CLAWD_LINES);
export const COMPACT_CLAWD_WIDTH = getArtWidth(COMPACT_CLAWD_LINES);

/**
 * DeepSeek whale logo rendered from the source SVG as a static braille dot-matrix.
 */
export function Clawd({ variant = 'hero' }: { variant?: ClawdVariant } = {}): React.ReactNode {
  const lines = variant === 'compact' ? COMPACT_CLAWD_LINES : HERO_CLAWD_LINES;

  return (
    <Box flexDirection="column">
      {lines.map(line => (
        <Text key={line} color="clawd_body">
          {line}
        </Text>
      ))}
    </Box>
  );
}
