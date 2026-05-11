#!/bin/bash
echo "=========================================="
echo "   JobLens - CCPDMS Full Stack Launcher"
echo "=========================================="

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/CCPDMS_FINAL"
FRONTEND_DIR="$ROOT_DIR/joblens-frontend"

# Check Node
if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js not found! Install from https://nodejs.org"
    exit 1
fi

# Backend
echo ""
echo "[1/3] Setting up Backend..."
cd "$BACKEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

echo "[2/3] Starting Backend on port 5000..."
npm start &
BACKEND_PID=$!
sleep 3

# Frontend
echo ""
echo "[3/3] Setting up & Starting Frontend..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies (2-3 mins first time)..."
    npm install
fi

npm start &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo " ✅ JobLens is running!"
echo " Backend:  http://localhost:5000/api/health"
echo " Frontend: http://localhost:3000"
echo "=========================================="
echo ""
echo "Login Credentials:"
echo "  Coordinator: coordinator@college.edu / Test@123"
echo "  Student:     student@college.edu / Test@123"
echo ""
echo "Press Ctrl+C to stop both servers"

wait $BACKEND_PID $FRONTEND_PID
