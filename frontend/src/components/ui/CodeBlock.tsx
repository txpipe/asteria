import { useMemo } from 'react';
import { getHighlighter } from '@/utils/shiki';

interface CodeBlockProps {
  code: string;
  lang: 'tx3' | 'js' | 'json';
}

const highlighter = await getHighlighter();

export default function CodeBlock({ code, lang = 'tx3' }: CodeBlockProps) {
  const htmlCode = useMemo(
    () => highlighter.codeToHtml(code, { lang, theme: 'dracula' }),
    [code, lang],
  );

  return (
    <div
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Needed
      dangerouslySetInnerHTML={{ __html: htmlCode }}
    />
  );
}
