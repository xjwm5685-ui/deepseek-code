import * as React from 'react';
import { Box, Text } from '@anthropic/ink';
import { env } from '../../utils/env.js';

/**
 * DeepSeek whale logo rendered in block characters.
 * Shown next to the version header in the startup UI.
 */
export function Clawd(): React.ReactNode {
  if (env.terminal === 'Apple_Terminal') {
    return (
      <Box flexDirection="column" alignItems="center" paddingX={1}>
        <Text color="clawd_body">{'  .   |""|'}</Text>
        <Text color="clawd_body">{' ":"  \\_/ '}</Text>
        <Text color="clawd_body">{'~^~^~^~^~^~'}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="clawd_body">{'    .                         '}</Text>
      <Text color="clawd_body">{'   ":"                        '}</Text>
      <Text color="clawd_body">{' ___:____     |"\\/"/|          '}</Text>
      <Text color="clawd_body">{",'        `.    \\  /          "}</Text>
      <Text color="clawd_body">{'|  O        \\___/  |          '}</Text>
      <Text color="clawd_body">{'~^~^~^^~^~^~^~^~^~^~^~^~     '}</Text>
    </Box>
  );
}
