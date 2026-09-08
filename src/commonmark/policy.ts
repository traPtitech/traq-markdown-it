// Conservative default for standalone rendering. Application adapters supply
// their existing policy so integrating the shared parser does not change it.
export function validateLink(destination: string) {
  try {
    return ['http:', 'https:', 'mailto:', 'ftp:'].includes(
      new URL(destination, 'https://markdown.invalid').protocol
    )
  } catch {
    return false
  }
}
