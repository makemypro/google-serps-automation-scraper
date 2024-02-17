# google-chrome --remote-debugging-port=9222 --no-sandbox --disable-notifications --start-maximized --no-first-run --no-default-browser-check  --disable-dev-shm-usage

google-chrome --remote-debugging-port=9222 -no-sandbox --disable-notifications --start-maximized --no-first-run --no-default-browser-check --disable-dev-shm-usage --force-webrtc-ip-handling-policy=default_public_interface_only -incognito&>/dev/null &
# --proxy-server="http://192.168.1.107:36520"
# another approach
# https://github.com/NikolaiT/stealthy-scraping-tools/blob/main/example.py
