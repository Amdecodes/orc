# apps/web/Dockerfile
FROM node:20-bookworm-slim AS base

# Install system dependencies for canvas, sharp, and Tesseract
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
    libstdc++6 \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-amh \
    && rm -rf /var/lib/apt/lists/*

# Set up Python environment for autocrop
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
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client
RUN npx prisma generate
# Build web app
WORKDIR /app/apps/web
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary files for production
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/services ./services
COPY --from=builder /app/fonts ./fonts
COPY --from=builder /app/*.png /app/*.jpg /app/*.traineddata ./

# Copy scripts for the worker
COPY --from=builder /app/apps/web/src/scripts ./apps/web/src/scripts
COPY --from=builder /app/apps/web/src/lib ./apps/web/src/lib

# Ensure tsx is available for the worker
RUN npm install -g tsx

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
