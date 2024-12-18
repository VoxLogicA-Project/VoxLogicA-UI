# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies and tools needed for VoxLogicA setup
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    libicu-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code and setup script
COPY . .

# Setup VoxLogicA binary
ENV VOXLOGICA_BINARY_PATH=/opt/voxlogica
COPY .devcontainer/setup.sh ./setup.sh
RUN chmod +x ./setup.sh && \
    ./setup.sh && \
    rm setup.sh

# Build the application
RUN yarn build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Install production dependencies and tools needed for VoxLogicA
RUN apt-get update && apt-get install -y \
    libicu-dev \
    && rm -rf /var/lib/apt/lists/* && \
    mkdir -p /opt/voxlogica && \
    chown -R node:node /opt/voxlogica

# Copy package files and install production dependencies
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# Copy built application and VoxLogicA binary from builder
COPY --from=builder /app/build ./build
COPY --from=builder /opt/voxlogica /opt/voxlogica

# Create data directories with correct permissions
RUN mkdir -p /data/datasets /data/scripts /data/workspaces && \
    chown -R node:node /data /app /opt/voxlogica

# Use node user for better security
USER node

# Set environment variables for paths
ENV DATASET_PATH=/data/datasets \
    SCRIPTS_PATH=/data/scripts \
    WORKSPACES_PATH=/data/workspaces \
    VOXLOGICA_BINARY_PATH=/opt/voxlogica

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "build"] 