import type { RemovableRef } from '@vueuse/core'
import { useLocalStorage } from '@vueuse/core'
import { BACKGROUND_THEMES } from '#shared/utils/constants'

type BackgroundThemeId = keyof typeof BACKGROUND_THEMES

export const BACKGROUND_THEME_STORAGE_KEY = 'npmx-background-theme'

const backgroundThemeRef: RemovableRef<BackgroundThemeId | null> = useLocalStorage(
  BACKGROUND_THEME_STORAGE_KEY,
  null,
)

export function useBackgroundTheme() {
  const backgroundThemes = Object.entries(BACKGROUND_THEMES).map(([id, value]) => ({
    id: id as BackgroundThemeId,
    name: id,
    value,
  }))

  function setBackgroundTheme(id: BackgroundThemeId | null) {
    if (id) {
      document.documentElement.dataset.bgTheme = id
    } else {
      document.documentElement.removeAttribute('data-bg-theme')
    }
    backgroundThemeRef.value = id
  }

  return {
    backgroundThemes,
    selectedBackgroundTheme: computed(() => backgroundThemeRef.value),
    setBackgroundTheme,
  }
}
