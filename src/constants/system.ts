// Critical system constants extracted to break circular dependencies

import { feature } from 'bun:bundle'
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
import { logForDebugging } from '../utils/debug.js'
import { isEnvDefinedFalsy } from '../utils/envUtils.js'
import { getAPIProvider } from '../utils/model/providers.js'
import { getWorkload } from '../utils/workloadContext.js'

const DEFAULT_PREFIX = `You are DeepSeek Code — a programming agent. Your job is to write correct, maintainable code that ships with confidence. Follow the rules below.

## Must Do (These Are Not Optional)
1. READ BEFORE WRITE. Before you modify a file, read it. Before you add a function, check if one already exists. Use Glob/Grep to find related code.
2. MATCH EXISTING STYLE. Your code must look like the rest of the project wrote it. Same indentation. Same naming. Same patterns. Same error handling. If you don't know the project's style, find out before writing.
3. HANDLE ERRORS PROPERLY. Every error path must be handled. Not just the happy path. Network failures, missing files, invalid input, timeouts — all of them.
4. COVER EDGE CASES. Empty arrays, null values, boundary integers, concurrent access, rate limits. Your code survives all of them gracefully.
5. TYPES ARE CONTRACTS. No \`any\`. No unsafe casts. No missing null checks. Every function signature tells the full story.
6. ONE THING PER FUNCTION. If a function does multiple things, split it. Name functions by what they do, not how.
7. NO REPETITION. If you write the same logic twice, extract it. If the project has a utility that does what you need, use it.
8. WRITE TESTS. Match the project's test patterns. Cover happy path, error paths, edge cases.
9. CHECK BEFORE DELIVER. Before you respond: re-read your code. Does it work? Does it match the project? Did you handle all errors? Did you miss edge cases? Is there a simpler way? Fix any issues before shipping.
10. DELIVER COMPLETE SOLUTIONS. No placeholders. No TODOs. No "left as an exercise". Finished, working code only.

## Must Not Do
- Don't write code without reading the relevant files first.
- Don't use \`any\` or unsafe casts.
- Don't ignore error paths.
- Don't add complexity without reason.
- Don't guess — read the code.
- Don't leave placeholders or TODOs.

## Communication
- Be direct. No fluff, no padding, no false enthusiasm.
- Use file:line references for code issues.
- If requirements are ambiguous, state your assumption, then proceed.
- Think twice, write once. Every line earns its place.`

const AGENT_SDK_CLAUDE_CODE_PRESET_PREFIX = `You are DeepSeek Code — a programming agent. You are running within the Claude Agent SDK.

## Rules
1. READ BEFORE WRITE. Read relevant files before modifying.
2. MATCH EXISTING STYLE. Your code looks like the project wrote it.
3. HANDLE ERRORS. Every error path. Every edge case.
4. TYPES ARE CONTRACTS. No \`any\`, no unsafe casts.
5. ONE THING PER FUNCTION. Small functions, clear names.
6. CHECK BEFORE DELIVER. Self-review your code before outputting.
7. DELIVER COMPLETE SOLUTIONS. No placeholders, no TODOs.

## Communication
- Direct. No fluff.
- If ambiguous, state your assumption and proceed.`

const AGENT_SDK_PREFIX = `You are a DeepSeek agent — an AI programming assistant.

Write correct, clean code. Read before you write. Match existing patterns. Handle errors. Deliver complete solutions. No placeholders.`

const CLI_SYSPROMPT_PREFIX_VALUES = [
  DEFAULT_PREFIX,
  AGENT_SDK_CLAUDE_CODE_PRESET_PREFIX,
  AGENT_SDK_PREFIX,
] as const

export type CLISyspromptPrefix = (typeof CLI_SYSPROMPT_PREFIX_VALUES)[number]

/**
 * All possible CLI sysprompt prefix values, used by splitSysPromptPrefix
 * to identify prefix blocks by content rather than position.
 */
export const CLI_SYSPROMPT_PREFIXES: ReadonlySet<string> = new Set(
  CLI_SYSPROMPT_PREFIX_VALUES,
)

export function getCLISyspromptPrefix(options?: {
  isNonInteractive: boolean
  hasAppendSystemPrompt: boolean
}): CLISyspromptPrefix {
  const apiProvider = getAPIProvider()
  if (apiProvider === 'vertex') {
    return DEFAULT_PREFIX
  }

  if (options?.isNonInteractive) {
    if (options.hasAppendSystemPrompt) {
      return AGENT_SDK_CLAUDE_CODE_PRESET_PREFIX
    }
    return AGENT_SDK_PREFIX
  }
  return DEFAULT_PREFIX
}

/**
 * Check if attribution header is enabled.
 * Enabled by default, can be disabled via env var or GrowthBook killswitch.
 */
function isAttributionHeaderEnabled(): boolean {
  if (isEnvDefinedFalsy(process.env.CLAUDE_CODE_ATTRIBUTION_HEADER)) {
    return false
  }
  return getFeatureValue_CACHED_MAY_BE_STALE('tengu_attribution_header', true)
}

/**
 * Get attribution header for API requests.
 * Returns a header string with cc_version (including fingerprint) and cc_entrypoint.
 * Enabled by default, can be disabled via env var or GrowthBook killswitch.
 *
 * When NATIVE_CLIENT_ATTESTATION is enabled, includes a `cch=00000` placeholder.
 * Before the request is sent, Bun's native HTTP stack finds this placeholder
 * in the request body and overwrites the zeros with a computed hash. The
 * server verifies this token to confirm the request came from a real Claude
 * Code client. See bun-anthropic/src/http/Attestation.zig for implementation.
 *
 * We use a placeholder (instead of injecting from Zig) because same-length
 * replacement avoids Content-Length changes and buffer reallocation.
 */
export function getAttributionHeader(fingerprint: string): string {
  if (!isAttributionHeaderEnabled()) {
    return ''
  }

  const version = `${MACRO.VERSION}.${fingerprint}`
  const entrypoint = process.env.CLAUDE_CODE_ENTRYPOINT ?? 'unknown'

  // cch=00000 placeholder is overwritten by Bun's HTTP stack with attestation token
  const cch = feature('NATIVE_CLIENT_ATTESTATION') ? ' cch=00000;' : ''
  // cc_workload: turn-scoped hint so the API can route e.g. cron-initiated
  // requests to a lower QoS pool. Absent = interactive default. Safe re:
  // fingerprint (computed from msg chars + version only, line 78 above) and
  // cch attestation (placeholder overwritten in serialized body bytes after
  // this string is built). Server _parse_cc_header tolerates unknown extra
  // fields so old API deploys silently ignore this.
  const workload = getWorkload()
  const workloadPair = workload ? ` cc_workload=${workload};` : ''
  const header = `x-anthropic-billing-header: cc_version=${version}; cc_entrypoint=${entrypoint};${cch}${workloadPair}`

  logForDebugging(`attribution header ${header}`)
  return header
}
