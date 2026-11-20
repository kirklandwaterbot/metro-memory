#!/usr/bin/env node
// Points git at the versioned hooks in .githooks (mojibake pre-commit check).
// Runs from `npm install` via the "prepare" script; does nothing in CI or
// outside a git checkout.
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
if (process.env.CI || process.env.VERCEL || !fs.existsSync(path.join(root, '.git'))) {
  process.exit(0)
}
try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: root, stdio: 'ignore' })
} catch {
  // git not available; nothing to do
}
