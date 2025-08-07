import { Client } from '@tx3/protocol';

export function getProtocol(network: string) {
  return new Client({
    endpoint: process.env[`${network.toUpperCase()}_TRP_URL`] || "http://localhost:8164",
    headers: {
      "Content-Type": "application/json",
      "dmtr-api-key": process.env[`${network.toUpperCase()}_TRP_API_KEY`] || "",
    },
  });
}
