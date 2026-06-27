export function buildUserMessage(
  parts: Array<{ type: string; name?: string; content: string }>,
): string {
  return parts
    .map((p) => `<${p.type}${p.name ? ` name="${p.name}"` : ''}>\n${p.content}\n</${p.type}>`)
    .join('\n\n');
}
