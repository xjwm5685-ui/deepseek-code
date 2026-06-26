import { useMemo } from 'react'
import { useAnimationFrame, useTerminalFocus } from '@anthropic/ink'

/**
 * Smooth breathing/pulsing that cycles between two values.
 * Pauses when the terminal is not focused.
 *
 * @param enabled - Whether the animation is active
 * @param cycleMs - Full cycle duration in ms (breath in + breath out)
 * @returns normalized value in [0, 1] following a smooth sine wave
 */
export function useBreath(enabled: boolean, cycleMs: number = 2000): number {
  const focused = useTerminalFocus()
  const [ref, time] = useAnimationFrame(enabled && focused ? 30 : null)

  if (!enabled || !focused) return 0.5

  const t = (time % cycleMs) / cycleMs
  return (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2
}

/**
 * Smooth color pulse between two RGB colors.
 * Returns an RGB color string that cycles between colorA and colorB.
 *
 * @param enabled - Whether the animation is active
 * @param colorA - Start color as rgb(r,g,b)
 * @param colorB - End color as rgb(r,g,b)
 * @param cycleMs - Full cycle duration
 * @returns color string like 'rgb(r,g,b)'
 */
export function useColorPulse(
  enabled: boolean,
  colorA: string,
  colorB: string,
  cycleMs: number = 2000,
): string {
  const breath = useBreath(enabled, cycleMs)
  const rgbA = parseRgb(colorA)
  const rgbB = parseRgb(colorB)

  if (!rgbA || !rgbB) return colorA

  const r = Math.round(rgbA.r + (rgbB.r - rgbA.r) * breath)
  const g = Math.round(rgbA.g + (rgbB.g - rgbA.g) * breath)
  const b = Math.round(rgbA.b + (rgbB.b - rgbA.b) * breath)

  return `rgb(${r},${g},${b})`
}

/**
 * Smooth shimmer sweep across a text area.
 * Returns the current glimmer position normalized to [0, 1].
 */
export function useShimmerSweep(
  enabled: boolean,
  sweepMs: number = 1500,
): number {
  const focused = useTerminalFocus()
  const [ref, time] = useAnimationFrame(enabled && focused ? 30 : null)

  if (!enabled || !focused) return 0

  return (time % sweepMs) / sweepMs
}

/**
 * Smooth frame-based animation.
 * Returns the current frame index in [0, frameCount-1].
 */
export function useSmoothFrames(
  enabled: boolean,
  frameCount: number,
  frameDurationMs: number = 200,
): number {
  const focused = useTerminalFocus()
  const [ref, time] = useAnimationFrame(
    enabled && focused ? frameDurationMs : null,
  )

  return useMemo(() => {
    if (!enabled || !focused) return 0
    return Math.floor(time / frameDurationMs) % frameCount
  }, [enabled, focused, frameCount, frameDurationMs, time])
}

/**
 * Gentle wave/bounce animation. Each index in a sequence animates
 * with a slight phase offset, creating a ripple/wave effect.
 *
 * @param enabled - Whether the animation is active
 * @param index - The index of the element in the wave sequence
 * @param totalElements - Total number of elements in the wave
 * @param cycleMs - Full wave cycle duration
 * @returns offset value in [0, 1] representing the wave position
 */
export function useWaveOffset(
  enabled: boolean,
  index: number,
  totalElements: number,
  cycleMs: number = 2000,
): number {
  const focused = useTerminalFocus()
  const [ref, time] = useAnimationFrame(enabled && focused ? 30 : null)

  if (!enabled || !focused) return 0.5

  const phase = (index / totalElements) * Math.PI * 2
  const t = (time % cycleMs) / cycleMs
  return (Math.sin(t * Math.PI * 2 + phase - Math.PI / 2) + 1) / 2
}

/**
 * Gentle flicker effect that randomly toggles between dim states.
 * Creates a subtle "alive" feel for status indicators.
 *
 * @param enabled - Whether the animation is active
 * @param flickerMs - Average time between flickers
 * @returns true when the element should be highlighted
 */
export function useGentleFlicker(
  enabled: boolean,
  flickerMs: number = 3000,
): boolean {
  const focused = useTerminalFocus()
  const [ref, time] = useAnimationFrame(enabled && focused ? flickerMs : null)

  if (!enabled || !focused) return false

  // Deterministic "random" flicker based on time
  const epoch = Math.floor(time / flickerMs)
  const pseudoRand = ((epoch * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff

  return pseudoRand > 0.92 // ~8% chance of flicker per tick
}

function parseRgb(color: string): { r: number; g: number; b: number } | null {
  const match = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
  if (!match) return null
  return {
    r: parseInt(match[1]!, 10),
    g: parseInt(match[2]!, 10),
    b: parseInt(match[3]!, 10),
  }
}
