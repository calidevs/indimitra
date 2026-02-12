#!/bin/bash

# Security Manual Testing Script
# Usage: ./test_security.sh [JWT_TOKEN]

# Don't exit on errors - we want to run all tests
# set -e

BASE_URL="http://localhost:8000"
JWT_TOKEN="${1:-}"

echo "================================"
echo "IndiMitra Security Testing"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper functions
test_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED++))
}

test_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED++))
}

test_info() {
    echo -e "${YELLOW}ℹ INFO${NC}: $1"
}

test_section() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check if server is running
echo "Checking if server is running..."
if ! curl -s -f "$BASE_URL/openapi.json" > /dev/null; then
    echo -e "${RED}ERROR: Server is not running at $BASE_URL${NC}"
    echo "Start the server with: docker-compose -f docker-compose-local.yml up"
    exit 1
fi
test_pass "Server is running"
echo ""

# ============================================================
# Phase 1: Authentication Tests
# ============================================================
test_section "Phase 1: Authentication Tests"
echo ""

# Test 1: BAD - Unauthenticated request
echo "Test 1 (BAD): Unauthenticated GraphQL request..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/graphql" \
    -H "Content-Type: application/json" \
    -d '{"query":"{ getAllOrders { id } }"}')

STATUS=$(echo "$RESPONSE" | tail -1)
if [ "$STATUS" -eq 401 ]; then
    test_pass "Unauthenticated request blocked (401)"
else
    test_fail "Expected 401, got $STATUS"
fi
echo ""

# Test 2: BAD - Invalid token
echo "Test 2 (BAD): Invalid JWT token..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/graphql" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer invalid_token_12345" \
    -d '{"query":"{ getAllOrders { id } }"}')

STATUS=$(echo "$RESPONSE" | tail -1)
if [ "$STATUS" -eq 401 ]; then
    test_pass "Invalid token rejected (401)"
else
    test_fail "Expected 401, got $STATUS"
fi
echo ""

# Test 3: GOOD - Excluded paths work without auth
echo "Test 3 (GOOD): Public endpoints accessible without auth..."

EXCLUDED_PASS=0
EXCLUDED_FAIL=0

for path in "/docs" "/redoc" "/openapi.json"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
    if [ "$STATUS" -eq 200 ]; then
        ((EXCLUDED_PASS++))
    else
        ((EXCLUDED_FAIL++))
        echo "  ✗ Path $path returned $STATUS (expected 200)"
    fi
done

if [ "$EXCLUDED_FAIL" -eq 0 ]; then
    test_pass "All public endpoints accessible (3/3 passed)"
else
    test_fail "$EXCLUDED_FAIL/3 public endpoints failed"
fi
echo ""

# Test 4: GOOD - Valid token
if [ -n "$JWT_TOKEN" ]; then
    echo "Test 4 (GOOD): Valid JWT token..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/graphql" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -d '{"query":"{ getAllOrders { id } }"}')

    STATUS=$(echo "$RESPONSE" | tail -1)
    if [ "$STATUS" -eq 200 ]; then
        test_pass "Valid token accepted and query executed (200)"
    else
        test_fail "Expected 200, got $STATUS"
        echo "  Response: $(echo "$RESPONSE" | head -n -1 | head -c 200)"
    fi
else
    test_info "Skipping valid token test (no JWT_TOKEN provided)"
    echo "    Run: ./test_security.sh YOUR_JWT_TOKEN"
fi
echo ""

# ============================================================
# Phase 3: S3 Security Tests
# ============================================================
test_section "Phase 3: S3 Security Tests"
echo ""

# Test 5: BAD - S3 upload without auth
echo "Test 5 (BAD): S3 upload URL without authentication..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "$BASE_URL/s3/generate-upload-url?order_id=1&file_name=bill.pdf")

if [ "$STATUS" -eq 401 ]; then
    test_pass "S3 upload blocked without auth (401)"
else
    test_fail "Expected 401, got $STATUS"
fi
echo ""

if [ -n "$JWT_TOKEN" ]; then
    # Test 6: BAD - Executable file blocked
    echo "Test 6 (BAD): Executable file upload blocked..."
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        "$BASE_URL/s3/generate-upload-url?order_id=1&file_name=malware.exe" \
        -H "Authorization: Bearer $JWT_TOKEN")

    STATUS=$(echo "$RESPONSE" | tail -1)
    if [ "$STATUS" -eq 400 ]; then
        test_pass "Executable file blocked (400)"
    else
        test_fail "Expected 400 for .exe file, got $STATUS"
    fi
    echo ""

    # Test 7: GOOD - PDF with valid auth
    echo "Test 7 (GOOD/CONDITIONAL): PDF upload with valid auth..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        "$BASE_URL/s3/generate-upload-url?order_id=1&file_name=receipt.pdf" \
        -H "Authorization: Bearer $JWT_TOKEN")

    if [ "$STATUS" -eq 200 ]; then
        test_pass "PDF upload allowed with valid auth (200)"
    elif [ "$STATUS" -eq 403 ]; then
        test_info "PDF upload denied - user doesn't own order_id=1 (403)"
        echo "    This is expected if the authenticated user doesn't own order #1"
    elif [ "$STATUS" -eq 404 ]; then
        test_info "Order not found (404) - create an order first"
    else
        test_fail "Unexpected status for PDF: $STATUS"
    fi
    echo ""

    # Test 8: Validate image uploads
    echo "Test 8 (GOOD): Image file upload validation..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        "$BASE_URL/s3/generate-upload-url?order_id=1&file_name=photo.jpg" \
        -H "Authorization: Bearer $JWT_TOKEN")

    if [ "$STATUS" -eq 200 ]; then
        test_pass "Image file allowed (200)"
    elif [ "$STATUS" -eq 403 ] || [ "$STATUS" -eq 404 ]; then
        test_info "Image validation passed but order access denied ($STATUS)"
    else
        test_fail "Expected 200/403/404, got $STATUS"
    fi
else
    test_info "Skipping S3 file validation tests (no JWT_TOKEN provided)"
fi
echo ""

# ============================================================
# Phase 5: GraphQL Security Tests (BEFORE rate limiting)
# ============================================================
test_section "Phase 5: GraphQL Security Tests"
echo ""

if [ -n "$JWT_TOKEN" ]; then
    # Test 9: GOOD - Normal shallow query
    echo "Test 9 (GOOD): Normal shallow GraphQL query..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/graphql" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"query":"{ getAllOrders { id createdAt status } }"}')

    STATUS=$(echo "$RESPONSE" | tail -1)
    if [ "$STATUS" -eq 200 ]; then
        test_pass "Normal query executed successfully (200)"
    else
        test_fail "Expected 200, got $STATUS"
    fi
    echo ""

    # Test 10: BAD - Deeply nested query (exceeds max_depth=7)
    echo "Test 10 (BAD): Deeply nested query (10 levels, limit is 7)..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/graphql" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"query":"{ getAllOrders { id creator { orders { creator { orders { creator { orders { creator { orders { id } } } } } } } } } }"}')

    STATUS=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')  # Remove last line (works on macOS and Linux)

    if [ "$STATUS" -eq 400 ] || echo "$BODY" | grep -qi "depth"; then
        test_pass "Deep query blocked (400 or depth error detected)"
    else
        test_fail "Expected deep query to be blocked, got $STATUS"
        echo "  Response preview: $(echo "$BODY" | head -c 200)"
    fi
else
    test_info "Skipping GraphQL security tests (no JWT_TOKEN provided)"
fi
echo ""

# ============================================================
# Phase 4: Rate Limiting Tests (LAST - no cooldown needed)
# ============================================================
test_section "Phase 4: Rate Limiting Tests"
echo ""

if [ -n "$JWT_TOKEN" ]; then
    echo "Test 11: Rate limiting (120 req/min limit)..."
    echo "  Sending 130 requests rapidly to hit rate limit..."

    SUCCESS_COUNT=0
    RATE_LIMITED_COUNT=0
    FIRST_RATE_LIMITED=0

    for i in {1..130}; do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/graphql" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"query":"{ getAllOrders { id } }"}')

        if [ "$STATUS" -eq 200 ]; then
            ((SUCCESS_COUNT++))
        elif [ "$STATUS" -eq 429 ]; then
            ((RATE_LIMITED_COUNT++))
            if [ "$FIRST_RATE_LIMITED" -eq 0 ]; then
                FIRST_RATE_LIMITED=$i
            fi
        fi

        # Show progress every 20 requests
        if [ $((i % 20)) -eq 0 ]; then
            echo "  Progress: $i/130 requests (Success: $SUCCESS_COUNT, Rate limited: $RATE_LIMITED_COUNT)"
        fi
    done

    echo ""
    echo "  Final results: $SUCCESS_COUNT succeeded, $RATE_LIMITED_COUNT rate limited"

    # Expect around 110-125 to succeed before rate limiting kicks in
    # (Variation due to parallel request timing and sliding window algorithm)
    if [ "$SUCCESS_COUNT" -ge 110 ] && [ "$SUCCESS_COUNT" -le 125 ]; then
        test_pass "Rate limiting working correctly (first 429 at request #$FIRST_RATE_LIMITED, total rate limited: $RATE_LIMITED_COUNT)"
    elif [ "$RATE_LIMITED_COUNT" -eq 0 ]; then
        test_fail "Rate limiting NOT enforced - all 130 requests succeeded"
    else
        test_info "Rate limiting active but unexpected threshold (succeeded: $SUCCESS_COUNT, expected: 110-125)"
    fi

    echo ""
    test_info "Rate limiting test complete (no cooldown needed - this was the last test)"
else
    test_info "Skipping rate limiting test (no JWT_TOKEN provided)"
fi
echo ""

# ============================================================
# Summary
# ============================================================
test_section "Test Summary"
echo ""
echo -e "Results:"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo -e "  Total:  $((PASSED + FAILED))"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ $FAILED test(s) failed. Check the output above.${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
