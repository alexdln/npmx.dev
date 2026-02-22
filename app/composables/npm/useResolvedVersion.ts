import type { ResolvedPackageVersion } from 'fast-npm-meta'

export async function useResolvedVersion(
  packageName: MaybeRefOrGetter<string>,
  requestedVersion: MaybeRefOrGetter<string | null>,
) {
  const versionData = useState<string | null>('versionData')

  await callOnce(async () => {
    const version = toValue(requestedVersion)
    const name = toValue(packageName)
    const url = version
      ? `https://npm.antfu.dev/${name}@${version}`
      : `https://npm.antfu.dev/${name}`
    versionData.value = await $fetch<ResolvedPackageVersion>(url).then(data => data.version)
  })
  return versionData
}
