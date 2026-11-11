const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const ROOT = __dirname;
const IMAGES_DIR = path.join(ROOT, 'assets', 'images');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'dinetogether-dev';
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    console.warn('WARNING: ADMIN_USERNAME / ADMIN_PASSWORD are not set; using local dev defaults. Override in production.');
}

function isAllowedImageContentType(contentType = '') {
    const mime = String(contentType).split(';', 1)[0].trim().toLowerCase();
    return ALLOWED_IMAGE_MIME_TYPES.has(mime);
}

function getAllowedImageExtFromData(data, filename) {
    if (data && data.startsWith('data:image/')) {
        const match = data.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
        if (match) {
            const subtype = match[1].toLowerCase();
            if (subtype === 'svg' || subtype === 'svg+xml') {
                throw new Error('SVG uploads are not allowed for security reasons');
            }
            if (subtype === 'jpeg') return '.jpg';
            if (['jpg', 'png', 'webp', 'gif'].includes(subtype)) return `.${subtype}`;
            throw new Error('Unsupported image type');
        }
    }

    if (filename) {
        const matchExt = path.extname(filename).toLowerCase();
        if (matchExt === '.svg') {
            throw new Error('SVG uploads are not allowed for security reasons');
        }
        if (ALLOWED_IMAGE_EXTENSIONS.has(matchExt)) {
            return matchExt === '.jpeg' ? '.jpg' : matchExt;
        }
    }

    return '.jpg';
}

// Ensure assets/images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wasm': 'application/wasm',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

function setCors(res) {
    // Same-origin only: a wildcard would let any website drive the local upload API.
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function isAdminRoute(url) {
    const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
    return cleanUrl === '/_/admin' || cleanUrl === '/_/admin/' || cleanUrl.startsWith('/_/admin/') || cleanUrl === '/api/upload' || cleanUrl === '/api/upload-url' || cleanUrl === '/api/delete-profile-images';
}

function sendBasicAuthChallenge(res) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="DineTogether Admin"');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Authentication required for admin access' }));
}

function requireAdminAuth(req, res) {
    const url = req.url || '/';
    if (!isAdminRoute(url)) return false;

    const authHeader = req.headers.authorization || '';
    const match = /^Basic\s+([A-Za-z0-9+/=]+)$/.exec(authHeader);
    if (!match) {
        sendBasicAuthChallenge(res);
        return true;
    }

    try {
        const decoded = Buffer.from(match[1], 'base64').toString('utf8');
        const [user, pass] = decoded.split(':');
        if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
            return false;
        }
    } catch (_) {}

    sendBasicAuthChallenge(res);
    return true;
}

function getNextPhotoIndex(profileId) {
    let maxFound = 0;
    try {
        const files = fs.readdirSync(IMAGES_DIR);
        const prefix = `profile-${profileId}-`;
        for (const f of files) {
            if (f.startsWith(prefix)) {
                const rest = f.substring(prefix.length);
                const numPart = parseInt(rest.split('.')[0], 10);
                if (!isNaN(numPart) && numPart > maxFound) {
                    maxFound = numPart;
                }
            }
        }
    } catch (e) {}
    return maxFound + 1;
}

function downloadImage(url, destPath, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
        const client = url.startsWith('https:') ? https : http;
        const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 DineTogether/1.0' } }, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                let redirectUrl = res.headers.location;
                if (!redirectUrl.startsWith('http')) {
                    const parsed = new URL(url);
                    redirectUrl = new URL(redirectUrl, parsed.origin).href;
                }
                return downloadImage(redirectUrl, destPath, maxRedirects - 1).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to download image: HTTP ${res.statusCode}`));
            }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                const buf = Buffer.concat(chunks);
                fs.writeFileSync(destPath, buf);
                resolve({ size: buf.length, contentType: res.headers['content-type'] });
            });
        });
        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Download timeout'));
        });
    });
}

const server = http.createServer((req, res) => {
    let cleanUrl = req.url.split('?')[0].split('#')[0];

    try {
        cleanUrl = decodeURIComponent(cleanUrl);
    } catch (_) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('400 Bad Request');
    }

    // CORS preflight
    if (req.method === 'OPTIONS') {
        setCors(res);
        res.writeHead(204);
        return res.end();
    }

    if (requireAdminAuth(req, res)) {
        return;
    }

    // API: Base64 / Data URL upload endpoint
    if (req.method === 'POST' && cleanUrl === '/api/upload') {
        let bodyStr = '';
        req.on('data', chunk => {
            bodyStr += chunk;
            if (bodyStr.length > 30 * 1024 * 1024) { // 30MB limit
                setCors(res);
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Payload too large' }));
                req.destroy();
            }
        });
        req.on('end', () => {
            try {
                const body = JSON.parse(bodyStr || '{}');
                const profileId = parseInt(body.profileId, 10) || 1;
                let photoIndex = parseInt(body.photoIndex, 10);
                if (!photoIndex || isNaN(photoIndex)) {
                    photoIndex = getNextPhotoIndex(profileId);
                }

                let ext;
                try {
                    ext = getAllowedImageExtFromData(body.data, body.filename);
                } catch (err) {
                    setCors(res);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: err.message }));
                }

                let base64Data = body.data || '';
                const commaIdx = base64Data.indexOf(',');
                if (commaIdx !== -1) {
                    base64Data = base64Data.slice(commaIdx + 1);
                }
                const buffer = Buffer.from(base64Data, 'base64');

                const fileName = `profile-${profileId}-${photoIndex}${ext}`;
                const targetPath = path.join(IMAGES_DIR, fileName);

                fs.writeFileSync(targetPath, buffer);

                const fileUrl = `/assets/images/${fileName}`;
                setCors(res);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    url: fileUrl,
                    filename: fileName,
                    profileId,
                    photoIndex
                }));
            } catch (err) {
                console.error('Error handling upload:', err);
                setCors(res);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // API: Download external image URL endpoint
    if (req.method === 'POST' && cleanUrl === '/api/upload-url') {
        let bodyStr = '';
        req.on('data', chunk => {
            bodyStr += chunk;
            if (bodyStr.length > 5 * 1024 * 1024) {
                setCors(res);
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Payload too large' }));
                req.destroy();
            }
        });
        req.on('end', async () => {
            try {
                const body = JSON.parse(bodyStr || '{}');
                const profileId = parseInt(body.profileId, 10) || 1;
                let photoIndex = parseInt(body.photoIndex, 10);
                if (!photoIndex || isNaN(photoIndex)) {
                    photoIndex = getNextPhotoIndex(profileId);
                }
                const sourceUrl = (body.url || '').trim();
                const urlLower = sourceUrl.toLowerCase();

                if (!sourceUrl || (!sourceUrl.startsWith('http://') && !sourceUrl.startsWith('https://'))) {
                    setCors(res);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Invalid URL' }));
                }

                if (urlLower.endsWith('.svg') || urlLower.includes('.svg?')) {
                    setCors(res);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'SVG uploads are not allowed for security reasons' }));
                }

                const fileName = `profile-${profileId}-${photoIndex}.jpg`;
                const targetPath = path.join(IMAGES_DIR, fileName);

                const downloadResult = await downloadImage(sourceUrl, targetPath);
                const contentType = String(downloadResult?.contentType || '').toLowerCase();
                if (!isAllowedImageContentType(contentType) || contentType.includes('svg')) {
                    if (fs.existsSync(targetPath)) {
                        fs.unlinkSync(targetPath);
                    }
                    setCors(res);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Only raster image uploads are allowed' }));
                }

                const fileUrl = `/assets/images/${fileName}`;
                setCors(res);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    url: fileUrl,
                    filename: fileName,
                    profileId,
                    photoIndex
                }));
            } catch (err) {
                console.error('Error handling upload-url:', err);
                setCors(res);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // API: Delete profile photos from /assets/images
    if (req.method === 'POST' && cleanUrl === '/api/delete-profile-images') {
        let bodyStr = '';
        req.on('data', chunk => bodyStr += chunk);
        req.on('end', () => {
            try {
                const body = JSON.parse(bodyStr || '{}');
                const profileId = parseInt(body.profileId, 10);
                const photos = Array.isArray(body.photos) ? body.photos : [];
                const deletedFiles = [];

                if (fs.existsSync(IMAGES_DIR)) {
                    // 1. Delete all files matching profile-${profileId}-*.*
                    if (profileId && !isNaN(profileId)) {
                        const files = fs.readdirSync(IMAGES_DIR);
                        const prefix = `profile-${profileId}-`;
                        for (const file of files) {
                            if (file.startsWith(prefix)) {
                                const fullPath = path.join(IMAGES_DIR, file);
                                try {
                                    if (fs.existsSync(fullPath)) {
                                        fs.unlinkSync(fullPath);
                                        deletedFiles.push(file);
                                    }
                                } catch (e) {
                                    console.warn(`Could not delete file ${file}:`, e.message);
                                }
                            }
                        }
                    }

                    // 2. Delete any additional photos in body.photos pointing to /assets/images/ or /public/images/
                    for (const photoUrl of photos) {
                        if (typeof photoUrl === 'string' && (photoUrl.includes('/assets/images/') || photoUrl.includes('/public/images/'))) {
                            const fileName = path.basename(photoUrl.split('?')[0]);
                            if (fileName && !deletedFiles.includes(fileName)) {
                                const fullPath = path.join(IMAGES_DIR, fileName);
                                if (fs.existsSync(fullPath)) {
                                    try {
                                        fs.unlinkSync(fullPath);
                                        deletedFiles.push(fileName);
                                    } catch (e) {
                                        console.warn(`Could not delete file ${fileName}:`, e.message);
                                    }
                                }
                            }
                        }
                    }
                }

                setCors(res);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    profileId,
                    deletedCount: deletedFiles.length,
                    deletedFiles
                }));
            } catch (err) {
                console.error('Error deleting profile images:', err);
                setCors(res);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // Static file serving
    if (cleanUrl === '/' || cleanUrl === '') cleanUrl = '/index.html';
    
    // Resolve file path safely (compare against ROOT + separator, not a bare prefix)
    const filePath = path.normalize(path.join(ROOT, cleanUrl));
    const rootPrefix = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;

    if (filePath !== ROOT && !filePath.startsWith(rootPrefix)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('403 Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
        let finalPath = filePath;
        if (!err && stats.isDirectory()) {
            finalPath = path.join(filePath, 'index.html');
        }

        fs.stat(finalPath, (err2, stats2) => {
            if (err2 || !stats2.isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end(`404 Not Found: ${cleanUrl}`);
            }

            const ext = path.extname(finalPath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';

            const headers = {
                'Content-Type': contentType,
                'X-Content-Type-Options': 'nosniff',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'Service-Worker-Allowed': '/'
            };
            // Never let a stale service worker or shell HTML pin an old release
            if (finalPath.endsWith('sw.js') || ext === '.html') {
                headers['Cache-Control'] = 'no-cache';
            }

            res.writeHead(200, headers);

            fs.createReadStream(finalPath).pipe(res);
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  🍽️  DineTogether Local Development Server Running!`);
    console.log(`======================================================`);
    console.log(`  Local URL:        http://localhost:${PORT}`);
    console.log(`  Admin Dashboard:  http://localhost:${PORT}/#/_/admin`);
    console.log(`  Direct Admin:     http://localhost:${PORT}/_/admin/`);
    console.log(`======================================================\n`);
});
