declare module 'adm-zip' {
  interface ZipEntry {
    entryName: string
    isDirectory: boolean
    getData(): Buffer
  }
  class AdmZip {
    constructor(path?: string | Buffer)
    getEntries(): ZipEntry[]
    readAsText(entry: ZipEntry, encoding?: string): string
    addFile(entryPath: string, data: Buffer, comment?: string): void
    toBuffer(): Buffer
  }
  export = AdmZip
}
