import clsx from 'clsx';
import { useMemo } from 'react';

// Utils
import { getHighlighter } from '@/utils/shiki';

interface CodeProps {
  className?: string;
  code: string;
  lang: 'tx3' | 'js';
}

const highlighter = await getHighlighter();

export function Code({ className, code, lang = 'tx3' }: CodeProps) {
  const htmlCode = useMemo(
    () =>
      highlighter.codeToHtml(code, {
        lang,
        theme: 'dracula',
        transformers: [
          {
            pre(node) {
              node.properties.class = clsx(node.properties.class, 'px-4 py-4 overflow-scroll text-sm', className);
            },
          },
        ],
      }),
    [className, code, lang],
  );

  return (
    <div
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Needed
      dangerouslySetInnerHTML={{ __html: htmlCode }}
    />
  );
}
