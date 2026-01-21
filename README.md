# yeet

A simple file upload service running on Cloudflare Workers + R2. Files auto-expire after 7 days.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create the R2 bucket:
   ```bash
   npx wrangler r2 bucket create yeet-files
   ```

3. Set up auto-expiration (7 days):
   ```bash
   npx wrangler r2 bucket lifecycle add yeet-files --expire-days 7
   ```

4. Deploy the worker:
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

The response will be a memorable URL where your file can be accessed:
```
https://yeet.<your-subdomain>.workers.dev/curious-racehorse
```

### Download a file

```bash
# Download to stdout
curl https://yeet.<your-subdomain>.workers.dev/curious-racehorse

# Save to file
curl -o downloaded.txt https://yeet.<your-subdomain>.workers.dev/curious-racehorse

# Save with original filename
curl -OJ https://yeet.<your-subdomain>.workers.dev/curious-racehorse
```

### Examples

Upload an image and get the URL:
```bash
$ curl -T screenshot.png https://yeet.example.workers.dev/screenshot.png
https://yeet.example.workers.dev/golden-phoenix
```

Upload text from a command:
```bash
$ ls -la | curl -X POST -d @- -H "Content-Type: text/plain" https://yeet.example.workers.dev/
https://yeet.example.workers.dev/swift-kraken
```

Share a log file:
```bash
$ curl -T /var/log/app.log https://yeet.example.workers.dev/app.log
https://yeet.example.workers.dev/misty-glacier
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
