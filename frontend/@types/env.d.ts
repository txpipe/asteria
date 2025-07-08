/** biome-ignore-all lint/correctness/noUnusedVariables: Extend `process.env` type */
namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    BLOCKFROST_URL: string;
  }
}
