#!/bin/bash
# ============================================================
# JobLens — One-shot setup script
# Run from the folder containing both CCPDMS_FINAL/ and joblens-frontend/
# ============================================================

set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${GREEN}🔭 JobLens Setup Script${NC}"
echo "=============================="

# ── BACKEND ──────────────────────────────────────────────
echo -e "\n${YELLOW}[1/4] Setting up backend...${NC}"
cd CCPDMS_FINAL

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${RED}⚠  Created .env from example. EDIT IT NOW before continuing!${NC}"
  echo "   Required: MONGO_URI, JWT_SECRET, EMAIL_USER, EMAIL_PASS"
  echo ""
  read -p "Press ENTER after editing .env to continue..."
fi

echo "Installing backend dependencies..."
npm install --silent

echo "Seeding database with demo data..."
node seed.js

echo -e "${GREEN}✅ Backend ready${NC}"
cd ..

# ── FRONTEND ──────────────────────────────────────────────
echo -e "\n${YELLOW}[2/4] Setting up frontend...${NC}"
cd joblens-frontend

if [ ! -f ".env" ]; then
  cat > .env << 'ENV'
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CLAUDE_API_KEY=your_anthropic_key_here
ENV
  echo -e "${YELLOW}⚠  Created frontend .env. Add your Anthropic API key for AI features.${NC}"
  echo "   Get a free key at: https://console.anthropic.com"
fi

echo "Installing frontend dependencies..."
npm install --legacy-peer-deps --silent

echo -e "${GREEN}✅ Frontend ready${NC}"
cd ..

# ── INSTRUCTIONS ──────────────────────────────────────────
echo ""
echo "=============================="
echo -e "${GREEN}🚀 Setup complete!${NC}"
echo ""
echo "To run the application:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd CCPDMS_FINAL && npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd joblens-frontend && npm start"
echo ""
echo "  Then open: http://localhost:3000"
echo ""
echo "Check CCPDMS_FINAL/seed.js for demo login credentials."
echo "=============================="
