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
        'Upload: curl -X POST -T yourfile.txt https://your-worker.workers.dev/\n' +
        'Download: curl https://your-worker.workers.dev/<file-id>\n',
        { headers: { 'Content-Type': 'text/plain' } }
      );
    }

    return new Response('Method not allowed', { status: 405 });
  },
};

async function handleUpload(request, env, url) {
  const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
  const path = url.pathname.slice(1); // Remove leading slash
  
  // Get filename from: URL path, header, or Content-Disposition
  let filename = path || request.headers.get('X-Filename');
  if (!filename) {
    // Try to extract from Content-Disposition
    const disposition = request.headers.get('Content-Disposition');
    if (disposition) {
      const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]*)["']?/i);
      if (match) filename = match[1];
    }
  }
  
  // Generate unique key
  const id = crypto.randomUUID();
  const extension = filename ? getExtension(filename) : getExtensionFromContentType(contentType);
  const key = extension ? `${id}.${extension}` : id;

  // Store file in R2
  const body = await request.arrayBuffer();
  await env.BUCKET.put(key, body, {
    httpMetadata: {
      contentType: contentType,
    },
    customMetadata: {
      originalFilename: filename || 'unknown',
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
  
  if (object.customMetadata?.originalFilename) {
    headers.set('Content-Disposition', `inline; filename="${object.customMetadata.originalFilename}"`);
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
