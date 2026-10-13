set windows-shell := ["powershell.exe", "-NoLogo", "-NoProfile", "-Command"]

default: film

# Render and encode the films in assets/ (all, or the ones named), dark and light
film *names:
    bun tools/film/record.ts {{names}}

# Render a few frames of one film into tools/film/.frames for a look, e.g. `just peek hero 0,40,90`
peek name frames:
    bun tools/film/record.ts {{name}} --theme dark --only {{frames}}
