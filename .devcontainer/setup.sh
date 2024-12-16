#!/bin/bash

# Download and extract VoxLogicA
setup_voxlogica() {
  local os_name=$1
  local download_url=$2
  local output_dir=$3

  echo "Setting up VoxLogicA for $os_name..."

  mkdir -p "$output_dir"
  cd "$output_dir" || exit

  curl -L "$download_url" -o voxlogica.zip
  if [[ $os_name == "windows" ]]; then
    tar -xf voxlogica.zip
  else
    unzip -q voxlogica.zip
    chmod +x VoxLogicA
  fi
  mv VoxLogicA_*/* .

  rm -rf VoxLogicA_* voxlogica.zip
  cd - || exit
}

# Determine OS and corresponding download URL
case "$(uname -s)" in
  Linux*)   OS="linux"; URL="https://github.com/vincenzoml/VoxLogicA/releases/download/v1.3.3-experimental/VoxLogicA_1.3.3-experimental_linux-x64.zip";;
  Darwin*)  OS="macos"; URL="https://github.com/vincenzoml/VoxLogicA/releases/download/v1.3.3-experimental/VoxLogicA_1.3.3-experimental_osx-x64.zip";;
  CYGWIN*|MINGW*|MSYS*) OS="windows"; URL="https://github.com/vincenzoml/VoxLogicA/releases/download/v1.3.3-experimental/VoxLogicA_1.3.3-experimental_win-x64.zip";;
  *)        echo "Unsupported OS"; exit 1;;
esac

# Run setup
BINARY_PATH="${VOXLOGICA_BINARY_PATH:-/opt/voxlogica}"
setup_voxlogica "$OS" "$URL" "$BINARY_PATH"

# Run yarn install
yarn install