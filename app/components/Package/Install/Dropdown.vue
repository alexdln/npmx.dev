<script setup lang="ts">
import type { JsrPackageInfo } from '#shared/types/jsr'
import type { SlimPackumentVersion } from '#shared/types'
import type { DevDependencySuggestion } from '#shared/utils/dev-dependency'
import type { PublishSecurityDowngrade } from '~/utils/publish-security'

const props = defineProps<{
  packageName: string
  displayVersion?: SlimPackumentVersion | null
  requestedVersion?: string | null
  installVersionOverride?: string | null
  jsrInfo?: JsrPackageInfo | null
  devDependencySuggestion?: DevDependencySuggestion | null
  typesPackageName?: string | null
  executableInfo?: { hasExecutable: boolean; primaryCommand?: string } | null
  createPackageInfo?: { packageName: string } | null
  publishSecurityDowngrade?: PublishSecurityDowngrade | null
  downgradeFallbackInstallText?: string | null
  headingId: string
}>()

const { selectedPM, showTypesInInstall, copied, copyInstallCommand } = useInstallCommand(
  () => props.packageName,
  () => props.requestedVersion ?? null,
  () => props.jsrInfo ?? null,
  () => props.typesPackageName ?? null,
  () => props.installVersionOverride ?? null,
)

const { announce } = useCommandPalette()
const { polite } = useAnnouncer()
async function copyInstallCommandWithAnnounce() {
  const success = await copyInstallCommand()
  if (success) {
    polite($t('package.command.copied_install'))
    announce($t('command_palette.announcements.copied_to_clipboard'))
  }
}

const installParts = computed(() =>
  getInstallCommandParts({
    packageName: props.packageName,
    packageManager: selectedPM.value,
    version: props.installVersionOverride ?? props.requestedVersion,
    jsrInfo: props.jsrInfo,
  }),
)

const hasExtra = computed(
  () =>
    !!props.devDependencySuggestion?.recommended ||
    !!(props.typesPackageName && showTypesInInstall.value) ||
    !!props.executableInfo?.hasExecutable ||
    !!props.createPackageInfo,
)

const appSettings = useSettings()
const panelId = useId()
const isOpen = shallowRef(false)

onPrehydrate(() => {
  const settings = JSON.parse(localStorage.getItem('npmx-settings') || '{}')
  if (settings?.installCommandsExpanded) {
    document.documentElement.setAttribute('data-install-expanded', 'true')
  }
  console.log(
    'onPrehydrate',
    settings?.installCommandsExpanded,
    document.documentElement.dataset.installExpanded,
    isOpen.value,
  )
})

onMounted(() => {
  if (document.documentElement.dataset.installExpanded === 'true') {
    isOpen.value = true
  }
  console.log('onMounted', document.documentElement.dataset.installExpanded, isOpen.value)
})

function toggle() {
  appSettings.settings.value.installCommandsExpanded =
    !appSettings.settings.value.installCommandsExpanded

  if (appSettings.settings.value.installCommandsExpanded) {
    document.documentElement.setAttribute('data-install-expanded', 'true')
    isOpen.value = true
  } else {
    document.documentElement.removeAttribute('data-install-expanded')
    isOpen.value = false
  }
  console.log(
    'toggle',
    appSettings.settings.value.installCommandsExpanded,
    document.documentElement.dataset.installExpanded,
    isOpen.value,
  )
}

watch(isOpen, newVal => {
  console.log('watch isOpen', newVal)
})

watch(installParts, newVal => {
  console.log('watch installParts', newVal)
})

watch(
  () => appSettings.settings.value.installCommandsExpanded,
  newVal => {
    console.log('watch installCommandsExpanded', newVal)
  },
)

watch(
  () => selectedPM.value,
  newVal => {
    console.log('watch selectedPM', newVal)
  },
)
</script>

<template>
  <section class="scroll-mt-20">
    <h2 :id="headingId" class="sr-only">{{ $t('package.get_started.title') }}</h2>

    <PackageSecurityDowngradeAlert
      :downgrade="publishSecurityDowngrade ?? null"
      :fallback-install-text="downgradeFallbackInstallText"
    />

    <div
      class="w-full bg-bg-subtle border border-border rounded-lg transition-colors duration-200 relative"
    >
      <div class="flex items-stretch max-lg:flex-col lg:flex-row-reverse">
        <div
          class="flex items-center justify-between gap-1 px-3 border-s border-border-subtle max-lg:pt-2.5"
        >
          <div class="flex items-center gap-1">
            <PackageInstallDownloadTarball
              v-if="displayVersion"
              icon-only
              :package-name="packageName"
              :version="displayVersion"
            />
            <PackageManagerSelect />
          </div>
          <button
            v-if="hasExtra"
            type="button"
            data-testid="install-commands-toggle"
            class="flex items-center justify-center cursor-pointer size-8 rounded-md text-fg-subtle transition-all duration-150 hover:bg-bg-elevated hover:text-fg active:scale-90 focus-visible:outline-2 focus-visible:outline-accent/70"
            :aria-expanded="isOpen"
            :aria-controls="panelId"
            :aria-label="
              isOpen
                ? $t('package.get_started.collapse_commands')
                : $t('package.get_started.expand_commands')
            "
            @click="toggle"
          >
            <span
              class="i-lucide:chevron-down w-3.5 h-3.5 transition-transform duration-200 [:root[data-install-expanded=true]_&]:rotate-180"
              aria-hidden="true"
            />
          </button>
        </div>
        <div
          class="flex flex-1 items-center gap-3 min-w-0 px-2.5 py-2.5"
          data-testid="install-command"
        >
          <ButtonBase
            type="button"
            class="shrink-0 text-fg-muted bg-bg-subtle/80 border-border transition-all duration-150 hover:scale-105 active:scale-90 select-none"
            :aria-label="$t('package.get_started.copy_command')"
            :classicon="copied ? 'i-lucide:check' : 'i-lucide:copy'"
            @click.stop="copyInstallCommandWithAnnounce"
          />
          <div class="flex flex-1 items-center gap-3 min-w-0">
            <span class="text-fg-subtle font-mono text-sm select-none shrink-0">$</span>
            <code
              class="font-mono text-sm min-w-0 flex-1 truncate tracking-tight cursor-text select-text"
              dir="ltr"
              ><span
                v-for="(part, i) in installParts"
                :key="i"
                :class="i === installParts.length - 1 ? 'text-fg font-medium' : 'text-fg-muted'"
                >{{ i > 0 ? ' ' : '' }}{{ part }}</span
              ></code
            >
          </div>
        </div>
      </div>

      <div
        v-if="hasExtra"
        :id="panelId"
        data-install-panel
        class="grid overflow-hidden transition-[grid-template-rows] duration-250 ease-out grid-rows-[0fr] [:root[data-install-expanded=true]_&]:grid-rows-[1fr]"
        :inert="!isOpen"
      >
        <div class="min-h-0">
          <div
            class="border-t border-border-subtle divide-y divide-border-subtle transition-opacity duration-200 [:root[data-install-expanded=true]_&]:opacity-100 [:root[data-install-expanded=false]_&]:opacity-0"
          >
            <PackageInstallAdditionalCommands
              :package-name="packageName"
              :requested-version="requestedVersion"
              :install-version-override="installVersionOverride"
              :jsr-info="jsrInfo"
              :dev-dependency-suggestion="devDependencySuggestion"
              :types-package-name="typesPackageName"
              :show-types="showTypesInInstall"
              :executable-info="executableInfo"
              :create-package-info="createPackageInfo"
              :selected-pm="selectedPM"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
