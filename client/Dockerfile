# Use Node.js LTS version
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_1
ARG NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_2
ARG NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_3

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_1=$NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_1
ENV NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_2=$NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_2
ENV NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_3=$NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_3

# Build application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"] 