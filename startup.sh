#!/bin/bash
echo "Backend API Endpoint: $API_ENDPOINT"
sed -i "s|.setBaseURL(\([^)]*\))|.setBaseURL(\"$API_ENDPOINT\")|g" build/cannonswar/assets/main/index.js

http-server -c-1 --no-dotfiles -p 8080 build/cannonswar --cors Access-Control-Allow-Origin
fg %1
