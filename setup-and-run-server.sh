#!/bin/bash

echo "===== Node.js and HTTP Server Setup Script ====="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed."
    echo "To install Node.js, you can use Homebrew with:"
    echo "  brew install node"
    echo "Or download from https://nodejs.org/"
    echo "After installation, run this script again."
    open "https://nodejs.org/en/download/"
    exit 1
fi

# Check Node.js version
echo "Node.js is installed:"
node -v
echo ""

# Check if http-server is installed globally
if ! npm list -g http-server &> /dev/null; then
    echo "Installing http-server globally..."
    npm install -g http-server
    if [ $? -ne 0 ]; then
        echo "Failed to install http-server. Please check your network connection or npm configuration."
        exit 1
    fi
    echo "http-server installed successfully."
else
    echo "http-server is already installed."
fi
echo ""

# Start http-server in the current directory
echo "Starting http-server in the current directory..."
http-server & server_pid=$!

# Open browser to localhost:8080
echo "Opening browser..."
open "http://localhost:8080"

echo ""
echo "Server is running at http://localhost:8080"
echo "To stop the server, press Ctrl+C or run: kill $server_pid"
echo ""

# Wait for user to press Ctrl+C
trap "kill $server_pid; echo 'Server stopped.'; exit 0" INT
echo "Press Ctrl+C to stop the server"
wait 