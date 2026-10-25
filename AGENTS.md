# AGENTS.md

## Sadr

### Build and test
- The repo has no test suite. `npm test` is npm's placeholder script and exits 1 by design.
- Build check: `npm ci`, then `npx --no-install wrangler deploy --dry-run --outdir dist`. It bundles the Worker and exits without deploying.
- Run check: `npx --no-install wrangler dev --ip 127.0.0.1 --port 8787` serves the Worker against a local R2 simulator. `GET /` returns the usage text.
- Upload a file with `curl -T FILE http://127.0.0.1:8787/NAME`, then `GET` the returned URL. A chunked body, such as `curl -T -`, returns HTTP 500 because R2 needs a known length.

### Toolchain
- npm with a committed package-lock.json. No file in the repo pins the Node or npm version.
- CI runs only Semgrep (`.github/workflows/semgrep.yml`). No workflow builds or deploys the Worker.
