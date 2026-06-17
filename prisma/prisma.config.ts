// prisma.config.ts – Prisma 7 datasource configuration
import { defineConfig } from '@prisma/client/runtime';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
    provider: 'postgresql',
  },
});
