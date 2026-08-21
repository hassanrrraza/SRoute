#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========== SEEMROUTE LOGIN FLOW TEST ==========${NC}\n"

# Test 1: Check if app loads
echo -e "${YELLOW}Test 1: Checking if homepage redirects to login...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -L http://localhost:3000/)
if [ "$RESPONSE" == "200" ]; then
    echo -e "${GREEN}✓ PASS: Homepage is accessible (likely redirected to login)${NC}"
else
    echo -e "${RED}✗ FAIL: Got HTTP $RESPONSE${NC}"
fi

# Test 2: Check login page loads
echo -e "\n${YELLOW}Test 2: Checking if login page loads...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login)
if [ "$RESPONSE" == "200" ]; then
    echo -e "${GREEN}✓ PASS: Login page loaded successfully${NC}"
else
    echo -e "${RED}✗ FAIL: Got HTTP $RESPONSE${NC}"
fi

# Test 3: Test login API with admin credentials
echo -e "\n${YELLOW}Test 3: Testing login API with admin credentials...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@seemroute.local","password":"admin"}' \
  -c /tmp/cookies.txt)

if echo "$LOGIN_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ PASS: Login API returned success${NC}"
else
    echo -e "${RED}✗ FAIL: Login API failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
fi

# Test 4: Check if session cookie was set
echo -e "\n${YELLOW}Test 4: Checking if session cookie was set...${NC}"
if grep -q "session" /tmp/cookies.txt; then
    echo -e "${GREEN}✓ PASS: Session cookie was set${NC}"
    grep "session" /tmp/cookies.txt
else
    echo -e "${RED}✗ FAIL: Session cookie not found${NC}"
fi

# Test 5: Check if dashboard is accessible with cookie
echo -e "\n${YELLOW}Test 5: Testing dashboard access with session cookie...${NC}"
DASHBOARD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/cookies.txt http://localhost:3000/dashboard)
if [ "$DASHBOARD_RESPONSE" == "200" ]; then
    echo -e "${GREEN}✓ PASS: Dashboard is accessible with session cookie${NC}"
else
    echo -e "${RED}✗ FAIL: Got HTTP $DASHBOARD_RESPONSE${NC}"
fi

# Test 6: Check if API endpoints are accessible
echo -e "\n${YELLOW}Test 6: Testing API endpoints...${NC}"
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/login)
if [ "$API_RESPONSE" == "405" ] || [ "$API_RESPONSE" == "200" ]; then
    echo -e "${GREEN}✓ PASS: API endpoint is accessible${NC}"
else
    echo -e "${RED}✗ FAIL: Got HTTP $API_RESPONSE${NC}"
fi

echo -e "\n${BLUE}========== TEST COMPLETE ==========${NC}\n"
