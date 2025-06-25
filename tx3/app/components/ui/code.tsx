import clsx from 'clsx';
import { Fragment, useMemo } from 'react';

// Utils
import { getHighlighter } from '~/utils/shiki';

interface CodeProps {
  className?: string;
  code: string;
}

const highlighter = await getHighlighter();

export function Code({ className, code }: CodeProps) {
  const htmlCode = useMemo(() => highlighter.codeToHtml(code, {
    lang: 'tx3',
    theme: 'dracula',
    transformers: [{
      pre(node) {
        node.properties.class = clsx(node.properties.class, 'px-4 py-4 overflow-scroll text-sm', className);
      },
    }],

  }), [className, code]);

  return (
    <div
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Needed
      dangerouslySetInnerHTML={{ __html: htmlCode }}
    />
  )
}
