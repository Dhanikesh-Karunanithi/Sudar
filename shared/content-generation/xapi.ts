export function buildCreateXapiStatement(params: {
  creatorUserId: string
  tool: string
  exportFormat?: string
  objectId?: string
}): Record<string, unknown> {
  const objectId = params.objectId ?? `https://sudar.app/create/${params.tool}/${params.creatorUserId}/${Date.now()}`
  return {
    actor: {
      account: { homePage: 'https://sudar.app', name: params.creatorUserId },
    },
    verb: {
      id: 'http://adlnet.gov/expapi/verbs/created',
      display: { 'en-US': 'created' },
    },
    object: {
      id: objectId,
      definition: {
        type: 'http://adlnet.gov/expapi/activities/lesson',
        name: { 'en-US': `Sudar Create — ${params.tool}` },
      },
    },
    result: {
      extensions: {
        'https://sudar.app/xapi/export_format': params.exportFormat ?? 'json',
        'https://sudar.app/xapi/tool': params.tool,
      },
    },
    timestamp: new Date().toISOString(),
  }
}
