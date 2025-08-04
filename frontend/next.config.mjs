import createMDX from '@next/mdx';
import { withTX3 } from 'next-tx3';

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  transpilePackages: ['next-mdx-remote'],
  env: {
    API_URL: process.env.API_URL,
  },
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [
      ['remark-gfm'],
    ],
    rehypePlugins: [],
  },
});

export default withTX3({
  ...withMDX(nextConfig),
  tx3: {
    tx3Path: './tx3',
    autoWatch: process.env.NODE_ENV === 'development',
    autoSetup: true,
    verbose: process.env.NODE_ENV === 'development',
  },
});