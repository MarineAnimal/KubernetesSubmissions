#!/usr/bin/env bash
set -e

# Special:Random redirects to a random article. We don't follow the
# redirect, we just want the Location header it gives us.
URL=$(curl -s -o /dev/null -D - "https://en.wikipedia.org/wiki/Special:Random" | grep -i "^location:" | awk '{print $2}' | tr -d '\r')

# Wikipedia's Location header can come back as "//en.wikipedia.org/..."
# (protocol-relative) instead of a full URL. Add the scheme if it's missing.
if [[ "$URL" == //* ]]; then
  URL="https:$URL"
fi

echo "Got random article: $URL"

curl -s -X POST "$TODO_BACKEND_URL/todos" \
  -H "Content-Type: application/json" \
  -d "{\"todo\": \"Read $URL\"}"

echo "Todo added"
