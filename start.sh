#!/bin/bash

echo "🚀 Starting Interview App Deployment..."

# Build the frontend
echo "📦 Building React frontend..."
npm run build:client

# Start the server
echo "🌟 Starting Express server..."
npm start