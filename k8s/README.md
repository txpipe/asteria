# Kubernetes

`chart/` deploys the Asteria challenge services from the images the workflows
publish to ghcr.io:

- **backend**: the GraphQL API (`backend/`, `ghcr.io/txpipe/asteria-backend`).
  It reads chain state from a Blockfrost-compatible endpoint, set with
  `backend.blockfrostBaseUrl`.
- **frontend**: the game site (`frontend/`, `ghcr.io/txpipe/asteria-frontend`),
  disabled by default. Its backend URLs are inlined when the image is built, so
  pointing it at another backend means building a new image.

The chart assumes no cluster, hostname, chain endpoint or image tag. Each
instance supplies them in its own values file, and the chart refuses to render
without them:

```sh
helm lint chart --values values.my-instance.yaml
helm template asteria chart --namespace asteria --values values.my-instance.yaml
```

Both images are built for `linux/amd64` only, so placement must land on x86
nodes. The backend runs as a non-root user on a read-only root filesystem.
