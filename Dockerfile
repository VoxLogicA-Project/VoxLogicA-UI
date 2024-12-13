# Build stage
FROM node:20-slim as builder

WORKDIR /app

# Add build dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source and build
COPY . .
RUN yarn build

# Production stage
FROM node:20-slim as production

WORKDIR /app

# Install production dependencies only
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# Copy built application
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json

# Copy VoxLogicA binaries
COPY static/bin/VoxLogicA ./static/bin/VoxLogicA

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libicu-dev \
    && rm -rf /var/lib/apt/lists/*

# Create data directories
RUN mkdir -p /data/datasets /data/scripts /data/workspaces && \
    chown -R node:node /data

# Use non-root user
USER node

EXPOSE 3000

CMD ["node", "build"] 