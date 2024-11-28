"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

const CodeBlock = ({
  content,
}: {
  content: string;
}) => {
  const [code, setCode] = useState<string>('<div></div>');

  useEffect(() => {
    codeToHtml(content, { lang: 'typescript', theme: 'dark-plus' }).then(setCode);
  }, [content]);
  
  return <div dangerouslySetInnerHTML={{ __html: code }} />;
}

export default CodeBlock;