import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { useBytesFormatter } from '../../../../app/composables/useNumberFormatter'

describe('useBytesFormatter', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('useI18n', () => ({
      locale: ref('en-US'),
      t: (key: string, params?: { size?: string }) => {
        const size = params?.size ?? ''

        if (key === 'package.size.b') return `${size} B`
        if (key === 'package.size.kb') return `${size} kB`
        if (key === 'package.size.mb') return `${size} MB`

        return key
      },
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('formats values below 1 kB in bytes', () => {
    const { format } = useBytesFormatter()

    expect(format(0)).toBe('0 B')
    expect(format(999)).toBe('999 B')
  })

  it('formats kB values using decimal base (1024)', () => {
    const { format } = useBytesFormatter()

    expect(format(1024)).toBe('1 kB')
    expect(format(8704)).toBe('8.5 kB')
  })

  it('formats MB values using decimal base (1024 * 1024)', () => {
    const { format } = useBytesFormatter()

    expect(format(1_048_576)).toBe('1 MB')
    expect(format(1_572_864)).toBe('1.5 MB')
  })
})
