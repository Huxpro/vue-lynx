export function fileIcon(mediaType: string, fileName = ''): string {
  const type = mediaType.toLowerCase();
  const name = fileName.toLowerCase();
  if (
    type.includes('csv') ||
    type.includes('excel') ||
    type.includes('spreadsheet') ||
    /\.(csv|xls|xlsx|ods)$/.test(name)
  ) {
    return 'i-lucide-file-spreadsheet';
  }
  if (
    type.startsWith('text/') ||
    type.includes('pdf') ||
    type.includes('word') ||
    type.includes('document') ||
    /\.(pdf|txt|md|doc|docx|rtf|json)$/.test(name)
  ) {
    return 'i-lucide-file-text';
  }
  return 'i-lucide-file';
}
