# Use the official Ubuntu base image with development tools
FROM mcr.microsoft.com/devcontainers/base:bullseye

# Install additional system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    build-essential \
    curl \
    git \
    sudo \
    openssh-client \
    gnupg \
    lsb-release \
    ca-certificates \
    software-properties-common \
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Install PostgreSQL client for database management
RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && apt-get update \
    && apt-get -y install postgresql-client-15 \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Install Supabase CLI
RUN curl -fsSL https://github.com/supabase/cli/releases/download/v1.110.1/supabase_linux_amd64.deb -o supabase.deb \
    && dpkg -i supabase.deb \
    && rm supabase.deb

# Set up the development user
USER vscode

# Install additional tools for the vscode user
RUN curl -fsSL https://get.pnpm.io/install.sh | sh - \
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Configure shell environment
RUN echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc \
    && echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc \
    && echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.bashrc

# Set working directory
WORKDIR /workspaces/hackathon

# Create development directories
RUN mkdir -p ~/.local/bin ~/.cache ~/.config

# Set environment variables for development
ENV NODE_ENV=development
ENV PATH="/home/vscode/.local/bin:$PATH"
ENV SHELL=/bin/zsh
