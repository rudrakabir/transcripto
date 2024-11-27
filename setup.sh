#!/bin/bash

# setup-whisper.sh
echo "Setting up Whisper.cpp for M1 Mac..."

# Check if we're on an M1 Mac
if [[ $(uname -m) != "arm64" ]]; then
    echo "Error: This script is intended for M1 Macs only"
    exit 1
fi

# Install dependencies
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

echo "Installing dependencies..."
brew install cmake ffmpeg

# Clone and build whisper.cpp
WHISPER_DIR="./deps/whisper.cpp"
mkdir -p deps
if [ ! -d "$WHISPER_DIR" ]; then
    echo "Cloning whisper.cpp..."
    git clone https://github.com/ggerganov/whisper.cpp.git "$WHISPER_DIR"
fi

cd "$WHISPER_DIR"
echo "Building whisper.cpp with Metal support..."
make clean
WHISPER_METAL=1 make -j

echo "Downloading medium model..."
bash ./models/download-ggml-model.sh medium.en

echo "Setup complete!"