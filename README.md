# yeet

A simple file upload service running on Cloudflare Workers + R2.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create the R2 bucket:
   ```bash
   npx wrangler r2 bucket create yeet-files
   ```

3. Deploy the worker:
   ```bash
   npx wrangler deploy
   ```

## Usage

### Upload a file

```bash
# Upload with filename in URL (recommended)
curl -T myfile.txt https://yeet.<your-subdomain>.workers.dev/myfile.txt

# Upload with filename header
curl -T photo.png -H "X-Filename: photo.png" https://yeet.<your-subdomain>.workers.dev/

# Upload with explicit content type
curl -T data.json -H "Content-Type: application/json" https://yeet.<your-subdomain>.workers.dev/data.json

# Pipe content directly
echo "Hello, World!" | curl -X POST -d @- https://yeet.<your-subdomain>.workers.dev/
```

The response will be the URL where your file can be accessed:
```
https://yeet.<your-subdomain>.workers.dev/abc123-def456.txt
```

### Download a file

```bash
# Download to stdout
curl https://yeet.<your-subdomain>.workers.dev/abc123-def456.txt

# Save to file
curl -o downloaded.txt https://yeet.<your-subdomain>.workers.dev/abc123-def456.txt

# Save with original filename
curl -OJ https://yeet.<your-subdomain>.workers.dev/abc123-def456.txt
```

### Examples

Upload an image and get the URL:
```bash
$ curl -T screenshot.png https://yeet.example.workers.dev/screenshot.png
https://yeet.example.workers.dev/550e8400-e29b-41d4-a716-446655440000.png
```

Upload text from a command:
```bash
$ ls -la | curl -X POST -d @- -H "Content-Type: text/plain" https://yeet.example.workers.dev/
https://yeet.example.workers.dev/6ba7b810-9dad-11d1-80b4-00c04fd430c8.txt
```

Share a log file:
```bash
$ curl -T /var/log/app.log https://yeet.example.workers.dev/app.log
https://yeet.example.workers.dev/6ba7b814-9dad-11d1-80b4-00c04fd430c8.log
```

## Local Development

```bash
npx wrangler dev
```

This starts a local server at `http://localhost:8787` with a local R2 simulator.

## Configuration

Edit `wrangler.toml` to customize:
- `name` - Worker name
- `bucket_name` - R2 bucket name
