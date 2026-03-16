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
  }
  export = AdmZip
}
