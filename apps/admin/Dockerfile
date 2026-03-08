FROM node:20-bookworm-slim AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY apps/bot/package.json ./apps/bot/
COPY services/id-engine/package.json ./services/id-engine/
COPY services/credit-engine/package.json ./services/credit-engine/
COPY services/payment-engine/package.json ./services/payment-engine/
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Declare build-time arguments
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG DATABASE_URL

# Expose them as environment variables so Next.js can access them during build
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV DATABASE_URL=$DATABASE_URL

# Build admin app
WORKDIR /app/apps/admin
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create public folder in case it doesn't exist, then copy build output
RUN mkdir -p ./apps/admin/public
COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001
CMD ["node", "apps/admin/server.js"]
