import * as React from 'react';
import { Clawd, type ClawdVariant } from './Clawd.js';

/**
 * Renders the DeepSeek whale logo. Wraps Clawd for layout compatibility.
 */
export function AnimatedClawd({ variant = 'hero' }: { variant?: ClawdVariant } = {}): React.ReactNode {
  return <Clawd variant={variant} />;
}
