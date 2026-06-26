import { describe, expect, test } from 'bun:test'
import { normalizeNameForMCP } from '../normalization'

describe('normalizeNameForMCP', () => {
  test('returns simple valid name unchanged', () => {
    expect(normalizeNameForMCP('my-server')).toBe('my-server')
  })

  test('replaces dots with underscores', () => {
    expect(normalizeNameForMCP('my.server.name')).toBe('my_server_name')
  })

  test('replaces spaces with underscores', () => {
    expect(normalizeNameForMCP('my server')).toBe('my_server')
  })

  test('replaces special characters with underscores', () => {
    expect(normalizeNameForMCP('server@v2!')).toBe('server_v2_')
  })

  test('returns already valid name unchanged', () => {
    expect(normalizeNameForMCP('valid_name-123')).toBe('valid_name-123')
  })

  test('returns empty string for empty input', () => {
    expect(normalizeNameForMCP('')).toBe('')
  })

  test('handles DeepSeek AI prefix: collapses consecutive underscores and strips edges', () => {
    // "DeepSeek AI My Server" -> replace invalid -> "claude_ai_My_Server"
    // starts with "DeepSeek AI " so collapse + strip -> "claude_ai_My_Server"
    expect(normalizeNameForMCP('DeepSeek AI My Server')).toBe(
      'claude_ai_My_Server',
    )
  })

  test('handles DeepSeek AI prefix with consecutive invalid chars', () => {
    // "DeepSeek AI ...test..." -> replace invalid -> "claude_ai____test___"
    // collapse consecutive _ -> "claude_ai_test_"
    // strip leading/trailing _ -> "claude_ai_test"
    expect(normalizeNameForMCP('DeepSeek AI ...test...')).toBe('claude_ai_test')
  })

  test('non-DeepSeek AI name preserves consecutive underscores', () => {
    // "a..b" -> "a__b", no DeepSeek AI prefix so no collapse
    expect(normalizeNameForMCP('a..b')).toBe('a__b')
  })

  test('non-DeepSeek AI name preserves trailing underscores', () => {
    expect(normalizeNameForMCP('name!')).toBe('name_')
  })

  test('handles DeepSeek AI prefix that results in only underscores', () => {
    // "DeepSeek AI ..." -> replace invalid -> "claude_ai____"
    // collapse -> "claude_ai_"
    // strip trailing -> "claude_ai"
    expect(normalizeNameForMCP('DeepSeek AI ...')).toBe('claude_ai')
  })
})
