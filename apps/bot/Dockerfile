# apps/bot/Dockerfile
FROM node:20-bookworm-slim AS base

# Install system dependencies for canvas and Tesseract (bot sometimes uses id-engine)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libc6 \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
    libssl-dev \
    openssl \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-amh \
    && rm -rf /var/lib/apt/lists/*

# Set up Python environment for autocrop if needed by id-engine
RUN pip3 install opencv-python-headless numpy --break-system-packages

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY apps/bot/package.json ./apps/bot/
COPY services/id-engine/package.json ./services/id-engine/
COPY services/credit-engine/package.json ./services/credit-engine/
COPY services/payment-engine/package.json ./services/payment-engine/
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client
RUN npx prisma generate
# Build bot app (transpile TS to JS)
WORKDIR /app/apps/bot
RUN npx tsc

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/bot/dist ./apps/bot/dist
COPY --from=builder /app/apps/bot/assets ./assets
COPY --from=builder /app/apps/bot/package.json ./apps/bot/package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/services/id-engine ./services/id-engine
COPY --from=builder /app/fonts ./fonts
COPY --from=builder /app/*.png /app/*.jpg /app/*.traineddata ./

WORKDIR /app/apps/bot
EXPOSE 5005
CMD ["node", "dist/bot.js"]
