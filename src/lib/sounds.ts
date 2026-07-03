import type { CountdownSoundSelection } from "../types.js"

type SoundOption = {
  id: string
  label: string
  url: string
}

const bundledSoundModules = {
  ...import.meta.glob('../../assets/*.{mp3,wav,ogg,m4a,aac,flac}', {
    eager: true,
    import: 'default',
    query: '?url',
  }),
  ...import.meta.glob('../../assets/sounds/*.{mp3,wav,ogg,m4a,aac,flac}', {
    eager: true,
    import: 'default',
    query: '?url',
  }),
} as Record<string, string>

function soundIdFromPath(filePath: string) {
  return filePath
    .replace(/^\.\.\/\.\.\/assets\//, '')
    .replace(/\\/g, '/')
}

function soundLabelFromId(id: string) {
  const fileName = id.split('/').pop() ?? id
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, '')
  return nameWithoutExt
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function mimeTypeFromPath(filePath: string) {
  const lower = filePath.toLowerCase()
  if (lower.endsWith('.mp3')) return 'audio/mpeg'
  if (lower.endsWith('.wav')) return 'audio/wav'
  if (lower.endsWith('.ogg')) return 'audio/ogg'
  if (lower.endsWith('.m4a')) return 'audio/mp4'
  if (lower.endsWith('.aac')) return 'audio/aac'
  if (lower.endsWith('.flac')) return 'audio/flac'
  return 'audio/mpeg'
}

async function playAudioUrl(url: string, revokeOnEnd = false): Promise<HTMLAudioElement> {
  const audio = new Audio(url)
  audio.preload = 'auto'

  if (revokeOnEnd) {
    const cleanup = () => URL.revokeObjectURL(url)
    audio.addEventListener('ended', cleanup, { once: true })
    audio.addEventListener('error', cleanup, { once: true })
  }

  await audio.play().catch((err) => {
    console.warn("[countdown-module] play audio", err)
    if (revokeOnEnd) URL.revokeObjectURL(url)
  })

  return audio
}

export const SOUND_OPTIONS: SoundOption[] = Object.entries(bundledSoundModules)
  .map(([filePath, url]) => {
    const id = soundIdFromPath(filePath)
    return {
      id,
      label: soundLabelFromId(id),
      url,
    }
  })
  .sort((a, b) => a.label.localeCompare(b.label))

const soundUrlMap = new Map(SOUND_OPTIONS.map((sound) => [sound.id, sound.url]))
const soundLabelMap = new Map(SOUND_OPTIONS.map((sound) => [sound.id, sound.label]))
const bundledSoundDurationCache = new Map<string, Promise<number | null>>()

export const DEFAULT_WARNING_SOUND_ID =
  SOUND_OPTIONS.find((sound) => sound.id === 'kitchen-timer.mp3')?.id ??
  SOUND_OPTIONS[0]?.id ??
  ''

export function resolveBundledSoundUrl(soundId: string) {
  return soundUrlMap.get(soundId) ?? null
}

export function resolveBundledSoundLabel(soundId: string) {
  return soundLabelMap.get(soundId) ?? soundLabelFromId(soundId)
}

export function createBundledSoundSelection(soundId: string): CountdownSoundSelection | null {
  if (!soundId) return null
  return {
    source: 'bundled',
    value: soundId,
    label: resolveBundledSoundLabel(soundId),
  }
}

export function createDefaultBundledSoundSelection(): CountdownSoundSelection | null {
  return createBundledSoundSelection(DEFAULT_WARNING_SOUND_ID)
}

export function playBundledSound(soundId: string): HTMLAudioElement | null {
  const url = resolveBundledSoundUrl(soundId)
  if (!url) return null

  const audio = new Audio(url)
  audio.preload = 'auto'
  audio.play().catch((err) => console.warn("[countdown-module] play bundled sound", err))
  return audio
}

export function getBundledSoundDuration(soundId: string): Promise<number | null> {
  const existing = bundledSoundDurationCache.get(soundId)
  if (existing) return existing

  const url = resolveBundledSoundUrl(soundId)
  if (!url) return Promise.resolve(null)

  const durationPromise = new Promise<number | null>((resolve) => {
    const audio = new Audio(url)
    audio.preload = 'metadata'

    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', handleLoaded)
      audio.removeEventListener('error', handleError)
    }

    const handleLoaded = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : null
      cleanup()
      resolve(duration)
    }

    const handleError = () => {
      cleanup()
      resolve(null)
    }

    audio.addEventListener('loadedmetadata', handleLoaded, { once: true })
    audio.addEventListener('error', handleError, { once: true })
  })

  bundledSoundDurationCache.set(soundId, durationPromise)
  return durationPromise
}

export async function playSelectedSound(
  sound: CountdownSoundSelection | null | undefined,
  fs?: { read: (path: string) => Promise<Uint8Array> } | null,
) {
  if (!sound) return

  if (sound.source === 'bundled') {
    playBundledSound(sound.value)
    return
  }

  if (!sound.path || !fs) return

  const bytes = await fs.read(sound.path)
  const arrayBuffer = new Uint8Array(bytes).buffer as ArrayBuffer
  const blob = new Blob([arrayBuffer], { type: mimeTypeFromPath(sound.path) })
  const url = URL.createObjectURL(blob)
  await playAudioUrl(url, true)
}
