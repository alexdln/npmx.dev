export function getPdsEndpointFromPlcDoc(doc: unknown) {
  if (!doc || typeof doc !== 'object') return

  const services = (doc as { service?: { id?: string; type?: string; serviceEndpoint?: string }[] })
    .service
  if (!Array.isArray(services) || services.length === 0) return

  const pds = services.find(
    service =>
      service.id === '#atproto_pds' ||
      service.type === 'AtprotoPersonalDataServer' ||
      (typeof service.id === 'string' && service.id.toLowerCase().includes('pds')),
  )

  return pds?.serviceEndpoint || services[0]?.serviceEndpoint
}
