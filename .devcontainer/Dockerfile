FROM node:20-slim

# Install basic development tools
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    libicu-dev \
    && rm -rf /var/lib/apt/lists/*

# Create VoxLogicA directory
RUN mkdir -p /opt/voxlogica && \
    chown -R node:node /opt/voxlogica

# Return to workspace directory and set permissions
WORKDIR /workspaces/VoxLogica-UI
RUN chown -R node:node /workspaces/VoxLogica-UI && \
    chmod -R 777 /workspaces/VoxLogica-UI

USER node