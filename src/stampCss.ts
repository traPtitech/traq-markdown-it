import MarkdownIt from 'markdown-it'
import regexp from 'markdown-it-regexp'

export const stampCssPlugin = (md: MarkdownIt, stamps: string[]): void => {
  regexp(/:([\w-_]+?)[:;]/, ([wrappedName, name]): string => {
    if (!stamps.includes(name)) return wrappedName

    return `<i class="emoji s${
      wrappedName.endsWith(':') ? 32 : 16
    } e_${name.replace(
      /\+/g,
      '_-plus-_'
    )}" title="${wrappedName}">${wrappedName}</i>`
  })(md)
}
