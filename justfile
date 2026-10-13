set windows-shell := ["powershell.exe", "-NoLogo", "-NoProfile", "-Command"]

chrome := env("CHROME", "C:/Program Files/Google/Chrome/Application/chrome.exe")

default: build

# Draw every SVG in assets/, dark and light
build:
    bun tools/build.ts

# Resample the nine-script glyphs into tools/points.json (needs Chrome)
sample:
    & "{{chrome}}" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=8000 --dump-dom "file:///$PWD/tools/sample.html" | bun tools/extract.ts > tools/points.json
