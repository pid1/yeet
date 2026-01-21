const ADJECTIVES = [
  'quick', 'lazy', 'happy', 'sad', 'bright', 'dark', 'warm', 'cool', 'swift', 'slow',
  'brave', 'calm', 'eager', 'fancy', 'gentle', 'jolly', 'kind', 'lively', 'merry', 'nice',
  'proud', 'silly', 'witty', 'zany', 'bold', 'clever', 'daring', 'fierce', 'grand', 'humble',
  'keen', 'loyal', 'mighty', 'noble', 'odd', 'plain', 'quiet', 'rare', 'sharp', 'tough',
  'vast', 'wild', 'young', 'zealous', 'ancient', 'cosmic', 'dusty', 'elegant', 'frozen', 'golden',
  'hidden', 'icy', 'jade', 'knightly', 'lunar', 'misty', 'neon', 'orange', 'purple', 'rusty',
  'silver', 'tiny', 'ultra', 'velvet', 'wavy', 'xenial', 'yellow', 'zinc', 'azure', 'bronze',
  'coral', 'dapper', 'ember', 'frosty', 'gleaming', 'hazy', 'ivory', 'jumpy', 'kooky', 'lumpy',
];

const NOUNS = [
  'fox', 'dog', 'cat', 'bird', 'fish', 'lion', 'bear', 'wolf', 'deer', 'hawk',
  'owl', 'frog', 'duck', 'goat', 'lamb', 'pony', 'swan', 'crow', 'dove', 'seal',
  'crab', 'moth', 'wasp', 'newt', 'toad', 'hare', 'mole', 'vole', 'wren', 'lark',
  'pike', 'bass', 'trout', 'shark', 'whale', 'squid', 'clam', 'snail', 'beetle', 'cricket',
  'dragon', 'phoenix', 'griffin', 'unicorn', 'pegasus', 'sphinx', 'hydra', 'kraken', 'titan', 'golem',
  'wizard', 'knight', 'pirate', 'ninja', 'robot', 'alien', 'ghost', 'zombie', 'vampire', 'demon',
  'planet', 'comet', 'nebula', 'quasar', 'pulsar', 'galaxy', 'cosmos', 'aurora', 'eclipse', 'meteor',
  'mountain', 'river', 'forest', 'desert', 'island', 'volcano', 'glacier', 'canyon', 'meadow', 'ocean',
];

function generateSlug() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}-${noun}`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.slice(1); // Remove leading slash

    // Handle file upload
    if (request.method === 'POST' || request.method === 'PUT') {
      return handleUpload(request, env, url);
    }

    // Handle file retrieval
    if (request.method === 'GET' && path) {
      return handleDownload(path, env);
    }

    // Root path - show usage
    if (request.method === 'GET' && !path) {
      return new Response(
        'yeet - file upload service\n\n' +
        'Upload: curl -T yourfile.txt https://your-worker.workers.dev/yourfile.txt\n' +
        'Download: curl https://your-worker.workers.dev/<slug>\n',
        { headers: { 'Content-Type': 'text/plain' } }
      );
    }

    return new Response('Method not allowed', { status: 405 });
  },
};

async function handleUpload(request, env, url) {
  const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
  const pathFilename = url.pathname.slice(1); // Remove leading slash
  
  // Get filename from: URL path, header, or Content-Disposition
  let filename = pathFilename || request.headers.get('X-Filename');
  if (!filename) {
    // Try to extract from Content-Disposition
    const disposition = request.headers.get('Content-Disposition');
    if (disposition) {
      const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]*)["']?/i);
      if (match) filename = match[1];
    }
  }
  
  // Generate unique slug (retry if collision)
  let key;
  for (let i = 0; i < 10; i++) {
    key = generateSlug();
    const existing = await env.BUCKET.head(key);
    if (!existing) break;
  }

  const extension = filename ? getExtension(filename) : getExtensionFromContentType(contentType);

  // Store file in R2 (stream directly to avoid memory issues with large files)
  await env.BUCKET.put(key, request.body, {
    httpMetadata: {
      contentType: contentType,
    },
    customMetadata: {
      originalFilename: filename || 'unknown',
      extension: extension || '',
    },
  });

  // Return the URL
  const fileUrl = `${url.origin}/${key}`;
  return new Response(fileUrl + '\n', {
    status: 201,
    headers: { 'Content-Type': 'text/plain' },
  });
}

async function handleDownload(key, env) {
  const object = await env.BUCKET.get(key);
  
  if (!object) {
    return new Response('File not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
  
  const originalFilename = object.customMetadata?.originalFilename;
  if (originalFilename && originalFilename !== 'unknown') {
    headers.set('Content-Disposition', `inline; filename="${originalFilename}"`);
  } else if (object.customMetadata?.extension) {
    headers.set('Content-Disposition', `inline; filename="${key}.${object.customMetadata.extension}"`);
  }

  return new Response(object.body, { headers });
}

function getExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function getExtensionFromContentType(contentType) {
  const map = {
    'text/plain': 'txt',
    'text/html': 'html',
    'text/css': 'css',
    'text/javascript': 'js',
    'application/json': 'json',
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  };
  return map[contentType] || '';
}
