import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { getDeepSeekConfigHomeDir } from '../utils/envUtils.js'
import { logForDebugging } from '../utils/debug.js'

const DEEPSEEK_HOME = join(homedir(), '.DeepSeek')
const CLAUDE_HOME = join(homedir(), '.claude')
const CONFIG_FILENAME = 'config.json'

/**
 * Default config template for DeepSeek Code.
 * The user manually fills in their API key.
 */
const DEFAULT_CONFIG_JSON = JSON.stringify(
  {
    $schema:
      'https://raw.githubusercontent.com/deepseek-code/deepseek-code/main/docs/schemas/config.json',
    _readme:
      'DeepSeek Code configuration file. Set your API provider and credentials here.',
    _providers: {
      _supported: [
        'openai',
        'anthropic',
        'gemini',
        'grok',
        'bedrock',
        'vertex',
        'foundry',
      ],
      _env_var_method:
        "Set CLAUDE_CODE_USE_<PROVIDER>=1 and the provider's standard env vars (e.g. OPENAI_API_KEY, ANTHROPIC_API_KEY)",
      _config_method:
        'Or set "provider" and "apiKey" below. The settings/env below override auto-detection.',
    },

    // Pick ONE provider. Supported: openai, anthropic, gemini, grok, bedrock, vertex, foundry
    provider: 'openai',

    // Provider-specific settings (uncomment and fill what you need):
    _openai: {
      apiKey: 'sk-...',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
    },
    _anthropic: {
      apiKey: 'sk-ant-...',
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-sonnet-4-6',
    },
    _gemini: {
      apiKey: '...',
      model: 'gemini-2.0-flash',
    },
    _deepseek: {
      apiKey: 'sk-...',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-chat',
    },

    // Generic OpenAI-compatible (works with any OpenAI-API provider):
    // Set provider: "openai", then fill baseUrl + apiKey + model.
    // Examples: DeepSeek, Groq, OpenRouter, Together, Fireworks, etc.

    // UI settings
    theme: 'dark',
    verbose: false,
  },
  null,
  2,
)

/**
 * Initialize the ~/.DeepSeek config directory.
 * Creates the directory and config file if they don't exist.
 * If ~/.claude/ already exists with config, the user can choose to copy it.
 *
 * Called once at startup.
 */
export function ensureDeepSeekConfig(): {
  configDir: string
  isNewSetup: boolean
} {
  const deepseekDir = getDeepSeekConfigHomeDir()
  const configPath = join(deepseekDir, CONFIG_FILENAME)
  const isNewSetup = !existsSync(configPath)

  if (isNewSetup) {
    // Check if DeepSeek Code config exists for reference
    const claudeConfigPath = join(CLAUDE_HOME, 'settings.json')
    const claudeExists = existsSync(claudeConfigPath)

    // Write default config
    try {
      writeFileSync(configPath, DEFAULT_CONFIG_JSON, 'utf-8')
      logForDebugging(
        `[DeepSeek] Created config at ${configPath}${
          claudeExists ? ' (DeepSeek Code config detected at ~/.claude/)' : ''
        }`,
      )
    } catch (err) {
      logForDebugging(
        `[DeepSeek] Failed to create config: ${(err as Error).message}`,
      )
    }
  }

  return { configDir: deepseekDir, isNewSetup }
}

/**
 * Read API key from DeepSeek config or fall back to DeepSeek Code config/env.
 */
export function resolveApiKey(): string | null {
  // 1. Check env var first (highest priority)
  const envKey =
    process.env.ANTHROPIC_API_KEY ??
    process.env.DEEPSEEK_API_KEY ??
    process.env.OPENAI_API_KEY
  if (envKey) return envKey

  // 2. Check ~/.DeepSeek/config.json
  const dsConfigPath = join(DEEPSEEK_HOME, CONFIG_FILENAME)
  try {
    if (existsSync(dsConfigPath)) {
      const config = JSON.parse(readFileSync(dsConfigPath, 'utf-8'))
      if (config.apiKey) return config.apiKey
      if (config.apiProvider === 'deepseek' && config.apiKey)
        return config.apiKey
    }
  } catch {
    // ignore
  }

  // 3. Fall back to ~/.claude/settings.json (DeepSeek Code legacy)
  const claudeSettingsPath = join(CLAUDE_HOME, 'settings.json')
  try {
    if (existsSync(claudeSettingsPath)) {
      const settings = JSON.parse(readFileSync(claudeSettingsPath, 'utf-8'))
      if (settings.apiKey) return settings.apiKey
    }
  } catch {
    // ignore
  }

  return null
}

/**
 * Apply ~/.DeepSeek/config.json settings as environment variables.
 * This bridges the config file with the existing provider auto-detection system.
 * The existing code already reads env vars like:
 *   ANTHROPIC_API_KEY, OPENAI_API_KEY, OPENAI_BASE_URL,
 *   CLAUDE_CODE_USE_OPENAI, CLAUDE_CODE_USE_GEMINI, etc.
 *
 * Call this at startup before any API calls.
 */
export function applyDeepSeekConfig(): void {
  const dsConfigPath = join(DEEPSEEK_HOME, CONFIG_FILENAME)
  try {
    if (!existsSync(dsConfigPath)) return
    const config = JSON.parse(readFileSync(dsConfigPath, 'utf-8'))
    if (!config.provider) return

    const provider = config.provider as string

    // Set the USE flag for the selected provider
    const flagMap: Record<string, string> = {
      openai: 'CLAUDE_CODE_USE_OPENAI',
      anthropic: '', // default, no flag needed
      gemini: 'CLAUDE_CODE_USE_GEMINI',
      grok: 'CLAUDE_CODE_USE_GROK',
      bedrock: 'CLAUDE_CODE_USE_BEDROCK',
      vertex: 'CLAUDE_CODE_USE_VERTEX',
      foundry: 'CLAUDE_CODE_USE_FOUNDRY',
      deepseek: 'CLAUDE_CODE_USE_OPENAI', // DeepSeek uses OpenAI-compatible API
    }

    const flag = flagMap[provider]
    if (flag) {
      process.env[flag] = '1'
    }

    // Set provider-specific env vars based on config fields
    // All providers use a standard pattern: <PROVIDER>_API_KEY, <PROVIDER>_BASE_URL
    const providerKeyMap: Record<
      string,
      { keyVar: string; urlVar?: string; modelVar?: string }
    > = {
      openai: { keyVar: 'OPENAI_API_KEY', urlVar: 'OPENAI_BASE_URL' },
      anthropic: { keyVar: 'ANTHROPIC_API_KEY', urlVar: 'ANTHROPIC_BASE_URL' },
      gemini: { keyVar: 'GEMINI_API_KEY' },
      grok: { keyVar: 'XAI_API_KEY' },
      deepseek: { keyVar: 'OPENAI_API_KEY', urlVar: 'OPENAI_BASE_URL' },
    }

    const mapping = providerKeyMap[provider]
    if (mapping) {
      // Try to find API key from provider-specific section or top-level
      const providerSection = config[`_${provider}`]
      const apiKey = providerSection?.apiKey || config.apiKey || ''
      const baseUrl = providerSection?.baseUrl || ''
      const model = providerSection?.model || config.model || ''

      if (apiKey && !process.env[mapping.keyVar]) {
        process.env[mapping.keyVar] = apiKey
      }
      if (mapping.urlVar && baseUrl && !process.env[mapping.urlVar]) {
        process.env[mapping.urlVar] = baseUrl
      }
      if (model && !process.env.ANTHROPIC_MODEL && !process.env.OPENAI_MODEL) {
        // Set model - the specific provider logic will pick this up
        process.env.DEEPSEEK_MODEL = model
      }
    }

    logForDebugging(`[DeepSeek] Applied config for provider: ${provider}`)
  } catch (err) {
    logForDebugging(
      `[DeepSeek] Failed to apply config: ${(err as Error).message}`,
    )
  }
}
