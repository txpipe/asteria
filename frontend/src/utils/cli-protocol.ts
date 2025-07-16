import { Client } from '@tx3/protocol';

export const protocol = new Client({
  endpoint: process.env.TRP_URL || "http://localhost:8164",
  headers: {
    "Content-Type": "application/json",
    "dmtr-api-key": process.env.TRP_API_KEY || "",
  },
});
