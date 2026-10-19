import { cp, rm } from 'node:fs/promises';

const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await cp(new URL('../apps/arcade/dist/', import.meta.url), output, { recursive: true });
await cp(new URL('../apps/portfolio/dist/', import.meta.url), new URL('portfolio/', output), { recursive: true });
