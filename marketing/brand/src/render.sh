#!/usr/bin/env bash
# Render the HTML compositions in this folder to ../*.png with headless Chrome.
#   ./render.sh            render everything
#   ./render.sh hero og    render only some
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PROFILE="$(mktemp -d)"
trap 'rm -rf "$PROFILE"' EXIT

# name  css-width css-height device-scale-factor  -> output = width*dsf x height*dsf
JOBS="hero 1200 675 2
social-preview 1280 640 1
og 1200 630 1
ph-gallery-1 1270 760 1
ph-gallery-2 1270 760 1
ph-gallery-3 1270 760 1
ph-gallery-4 1270 760 1
ph-thumbnail 240 240 1"

while read -r name w h dsf; do
  if [ $# -gt 0 ] && [[ " $* " != *" $name "* ]]; then continue; fi
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$PROFILE" \
    --allow-file-access-from-files --window-size="$w,$h" --force-device-scale-factor="$dsf" \
    --virtual-time-budget=6000 --screenshot="$PWD/../$name.png" "file://$PWD/$name.html" 2>/dev/null
  echo "rendered $name.png ($((w * dsf))x$((h * dsf)))"
done <<< "$JOBS"
