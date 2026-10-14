export type KbChunkScope = {
  kbId: string
  sourceDoc: string
  queueId: string
}

/** Metadata keys used to scope KB chunk deletes to one document ingest. */
export function kbChunkMetadata(scope: KbChunkScope, chunkIndex: number) {
  return {
    kb_id: scope.kbId,
    source_doc: scope.sourceDoc,
    queue_id: scope.queueId,
    chunk_index: chunkIndex,
  }
}
