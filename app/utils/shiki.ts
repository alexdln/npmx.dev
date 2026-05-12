import type { ThemeRegistration } from 'shiki'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

let highlighter: HighlighterCore | null = null
let highlighterPromise: Promise<HighlighterCore> | null = null

function replaceThemeColors(
  theme: ThemeRegistration,
  replacements: Record<string, string>,
): ThemeRegistration {
  let themeString = JSON.stringify(theme)
  for (const [oldColor, newColor] of Object.entries(replacements)) {
    themeString = themeString.replaceAll(oldColor, newColor)
    themeString = themeString.replaceAll(oldColor.toLowerCase(), newColor)
    themeString = themeString.replaceAll(oldColor.toUpperCase(), newColor)
  }
  return JSON.parse(themeString)
}

export async function getShikiHighlighter(): Promise<HighlighterCore> {
  if (highlighter) {
    return highlighter
  }

  highlighterPromise ??= createHighlighterCore({
    themes: [
      import('@shikijs/themes/github-dark'),
      import('@shikijs/themes/github-light').then(t =>
        replaceThemeColors(t.default ?? t, {
          '#22863A': '#227436',
          '#E36209': '#BA4D02',
          '#D73A49': '#CD3443',
          '#B31D28': '#AC222F',
        }),
      ),
    ],
    langs: [
      import('@shikijs/langs/javascript'),
      import('@shikijs/langs/typescript'),
      import('@shikijs/langs/json'),
      import('@shikijs/langs/jsonc'),
      import('@shikijs/langs/html'),
      import('@shikijs/langs/css'),
      import('@shikijs/langs/scss'),
      import('@shikijs/langs/less'),
      import('@shikijs/langs/vue'),
      import('@shikijs/langs/jsx'),
      import('@shikijs/langs/tsx'),
      import('@shikijs/langs/svelte'),
      import('@shikijs/langs/astro'),
      import('@shikijs/langs/glimmer-js'),
      import('@shikijs/langs/glimmer-ts'),
      import('@shikijs/langs/bash'),
      import('@shikijs/langs/shell'),
      import('@shikijs/langs/yaml'),
      import('@shikijs/langs/toml'),
      import('@shikijs/langs/xml'),
      import('@shikijs/langs/markdown'),
      import('@shikijs/langs/diff'),
      import('@shikijs/langs/sql'),
      import('@shikijs/langs/graphql'),
      import('@shikijs/langs/python'),
      import('@shikijs/langs/rust'),
      import('@shikijs/langs/go'),
    ],
    langAlias: {
      gjs: 'glimmer-js',
      gts: 'glimmer-ts',
    },
    engine: createJavaScriptRegexEngine(),
  })
    .then(createdHighlighter => {
      highlighter = createdHighlighter
      return createdHighlighter
    })
    .catch(error => {
      highlighterPromise = null
      throw error
    })

  return highlighterPromise
}

export function escapeRawGt(html: string): string {
  return html.replace(/>([^<]*)/g, (_, textContent) => {
    const escapedText = textContent.replace(/>/g, '&gt;')
    return `>${escapedText}`
  })
}

export function highlightCodeSync(shiki: HighlighterCore, code: string, language: string): string {
  const loadedLangs = shiki.getLoadedLanguages()

  if (loadedLangs.includes(language as never)) {
    try {
      let html = shiki.codeToHtml(code, {
        lang: language,
        themes: { light: 'github-light', dark: 'github-dark' },
        defaultColor: 'dark',
      })
      html = html.replace(/<pre([^>]*) style="[^"]*"/, '<pre$1')
      return escapeRawGt(html)
    } catch {
      // fall through to plain fallback
    }
  }

  const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<pre><code class="language-${language}">${escaped}</code></pre>\n`
}

export async function highlightCodeBlock(code: string, language: string): Promise<string> {
  const shiki = await getShikiHighlighter()
  return highlightCodeSync(shiki, code, language)
}
