#!/bin/bash

# DevContainer Initialize Script
# This script runs on the host before the container is created

set -e

echo "🔧 Preparing development environment..."

# Check if required tools are available on the host
command -v docker >/dev/null 2>&1 || {
    echo "❌ Docker is required but not installed."
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
}

command -v git >/dev/null 2>&1 || {
    echo "❌ Git is required but not installed."
    echo "Please install Git from https://git-scm.com/"
    exit 1
}

echo "✅ Required tools are available"

# Create directories that might be needed
mkdir -p .devcontainer
mkdir -p screenshots
mkdir -p docs

echo "✅ Environment preparation complete"
