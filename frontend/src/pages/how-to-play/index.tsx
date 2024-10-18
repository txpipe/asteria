import { promises as fs } from 'fs';
import type { GetStaticProps } from 'next';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote';

import Sidebar from '@/components/Sidebar';

import './markdown.css';

interface Props {
  mdxSource: MDXRemoteSerializeResult;
}

export default function HowToPlay({ mdxSource }: Props) {
  return (
    <div className="container 2xl mx-auto flex flex-row min-h-[calc(100vh-64px)]">

      <Sidebar />

      <div className="flex-initial basis-3/5 pt-4 pb-8 px-8">

        <h1 className="font-monocraft-regular text-4xl text-[#07F3E6] mb-8">
          HOW TO PLAY
        </h1>

        <div className="markdown-body">
          <MDXRemote {...mdxSource} />
        </div>

      </div>

    </div>
  );
}

export const getStaticProps: GetStaticProps<{
  mdxSource: MDXRemoteSerializeResult
}> = async () => {
  const markdown = await fs.readFile(process.cwd() + '/src/documentation/design.md', 'utf8');
  const mdxSource = await serialize(markdown);
  return { props: { mdxSource } };
}
