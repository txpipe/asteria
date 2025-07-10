const withMDX = require('@next/mdx')();
const withTX3 = require('next-tx3').withTX3;

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  transpilePackages: ['next-mdx-remote'],
  env: {
    API_URL: process.env.API_URL,
    BLOCKFROST_URL: process.env.BLOCKFROST_URL,
  },
  experimental: {
    mdxRs: true,
  },
}

module.exports = withTX3({
  ...withMDX(nextConfig),
  tx3: {
    tx3Path: './tx3',
    autoWatch: process.env.NODE_ENV === 'development',
    autoSetup: true,
    verbose: process.env.NODE_ENV === 'development'
  },
});