"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

const CodeBlock = ({
  content,
  lang
}: {
  lang?: string;
  content: string;
}) => {
  const [code, setCode] = useState<string>('<div></div>');

  useEffect(() => {
    codeToHtml(content, { lang: lang ? lang : 'typescript', theme: 'dark-plus' }).then(setCode);
  }, [content]);
  
  return <div dangerouslySetInnerHTML={{ __html: code }} />;
}

export default CodeBlock;