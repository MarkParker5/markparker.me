// Reads the human/bot-authored src/data/notes.jsonc (comments allowed) and
// writes src/data/notes.json (plain, derived, gitignored) — the file
// note.tsx actually `import`s. Plain JSON is what's imported directly
// because TypeScript/webpack's resolveJsonModule only understands strict
// JSON; JSONC can't be import-ed the same way, and reading it via `fs` at
// module scope would break the client bundle (no `fs` in the browser).
// Runs automatically before `dev`/`build` via npm's pre<script> hooks.
const fs = require('fs')
const path = require('path')
const { parse } = require('jsonc-parser')

const srcPath = path.join(__dirname, '..', 'src', 'data', 'notes.jsonc')
const outPath = path.join(__dirname, '..', 'src', 'data', 'notes.json')

const raw = fs.readFileSync(srcPath, 'utf8')
const errors = []
const data = parse(raw, errors, { allowTrailingComma: true })

if (errors.length > 0) {
  console.error('Failed to parse notes.jsonc:', errors)
  process.exit(1)
}

fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf8')
console.log(`generated notes.json (${data.length} note${data.length === 1 ? '' : 's'})`)
