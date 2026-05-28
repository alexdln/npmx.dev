import type { Page } from '@playwright/test'
import type { Noodle } from '../../app/components/Noodle'
import { expect, test } from './test-utils'

type MockNoodlesOptions = {
  active?: Noodle[]
  permanent?: Noodle[]
}

function htmlAttrEncode(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

async function mockNoodles(page: Page, options: MockNoodlesOptions = {}) {
  const activeJson = JSON.stringify(options.active ?? [])
  const permanentJson = JSON.stringify(options.permanent ?? [])

  await page.route(
    url => new URL(url).pathname === '/',
    async route => {
      const response = await route.fetch()
      const body = (await response.text())
        .replace(
          /data-active-noodles="[^"]*"/,
          `data-active-noodles="${htmlAttrEncode(activeJson)}"`,
        )
        .replace(
          /data-permanent-noodles="[^"]*"/,
          `data-permanent-noodles="${htmlAttrEncode(permanentJson)}"`,
        )

      await route.fulfill({ response, body })
    },
  )
}

const TEST_TIME = new Date('2099-06-15T12:00:00Z')
const TEST_DATE = '2099-06-15'

test.describe('LandingIntroHeader onPrehydrate noodle', () => {
  test.use({ timezoneId: 'UTC' })

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(TEST_TIME)
  })

  test.describe('default behavior', () => {
    test('no permanent or active match → default logo and tagline visible', async ({
      page,
      goto,
    }) => {
      await mockNoodles(page, {
        active: [{ key: 'noodle', date: '2099-06-12', logo: '' }],
        permanent: [{ key: 'kawaii', tagline: false, logo: '' }],
      })

      await goto('/', { waitUntil: 'hydration' })

      await expect(page.locator('#intro-header-noodle-default')).toBeVisible()
      await expect(page.locator('#intro-header-noodle-kawaii')).toBeHidden()
      await expect(page.locator('#intro-header-noodle-nodejs')).toBeHidden()
      await expect(page.locator('#intro-header-tagline')).toBeVisible()
    })
  })

  test.describe('permanent noodles', () => {
    test('matching query swaps in the noodle and hides the tagline (opt-out)', async ({
      page,
      goto,
    }) => {
      await mockNoodles(page, {
        permanent: [{ key: 'kawaii', tagline: false, logo: '' }],
        active: [],
      })

      await goto('/?kawaii', { waitUntil: 'hydration' })

      await expect(page.locator('#intro-header-noodle-kawaii')).toBeVisible()
      await expect(page.locator('#intro-header-noodle-default')).toBeHidden()
      await expect(page.locator('#intro-header-tagline')).toBeHidden()
    })
  })

  test.describe('active noodles', () => {
    test('exact date match → noodle visible, tagline visible', async ({ page, goto }) => {
      await mockNoodles(page, {
        active: [{ key: 'nodejs', date: TEST_DATE, timezone: 'UTC', logo: '' }],
      })

      await goto('/', { waitUntil: 'hydration' })

      await expect(page.locator('#intro-header-noodle-nodejs')).toBeVisible()
      await expect(page.locator('#intro-header-noodle-default')).toBeHidden()
      await expect(page.locator('#intro-header-tagline')).toBeVisible()
    })

    test('current date inside [date, dateTo] range → noodle visible', async ({ page, goto }) => {
      await mockNoodles(page, {
        active: [
          { key: 'nodejs', date: '2099-06-14', dateTo: '2099-06-16', timezone: 'UTC', logo: '' },
        ],
      })

      await goto('/', { waitUntil: 'hydration' })

      await expect(page.locator('#intro-header-noodle-nodejs')).toBeVisible()
      await expect(page.locator('#intro-header-noodle-default')).toBeHidden()
    })
  })

  test.describe('noodles in different timezone', () => {
    test('explicit timezone shifts current date forward (UTC late night → next day in JST)', async ({
      page,
      goto,
    }) => {
      // 2099-06-15T22:00Z is 2099-06-16 07:00 in Asia/Tokyo (UTC+9)
      await page.clock.setFixedTime(new Date('2099-06-15T22:00:00Z'))
      await mockNoodles(page, {
        active: [{ key: 'nodejs', date: '2099-06-16', timezone: 'Asia/Tokyo', logo: '' }],
      })

      await goto('/', { waitUntil: 'hydration' })

      await expect(page.locator('#intro-header-noodle-nodejs')).toBeVisible()
      await expect(page.locator('#intro-header-noodle-default')).toBeHidden()
    })
  })
})

test.describe('LandingIntroHeader onPrehydrate noodle — non-UTC browser timezone', () => {
  test.use({ timezoneId: 'America/Los_Angeles' })

  test('timezone "auto" follows the browser timezone (UTC early morning → previous day in LA)', async ({
    page,
    goto,
  }) => {
    // 2099-06-15T05:00Z is 2099-06-14 22:00 in America/Los_Angeles (UTC-7 DST)
    await page.clock.setFixedTime(new Date('2099-06-15T05:00:00Z'))
    await mockNoodles(page, {
      active: [{ key: 'nodejs', date: '2099-06-14', timezone: 'auto', logo: '' }],
    })

    await goto('/', { waitUntil: 'hydration' })

    await expect(page.locator('#intro-header-noodle-nodejs')).toBeVisible()
    await expect(page.locator('#intro-header-noodle-default')).toBeHidden()
  })
})
