const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const ROOT = __dirname;
const IMAGES_DIR = path.join(ROOT, 'assets', 'images');

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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

    // CORS preflight
    if (req.method === 'OPTIONS') {
        setCors(res);
        res.writeHead(204);
        return res.end();
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

                let ext = '.jpg';
                if (body.data && body.data.startsWith('data:image/')) {
                    const match = body.data.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
                    if (match) {
                        const sub = match[1].toLowerCase();
                        if (sub === 'png') ext = '.png';
                        else if (sub === 'webp') ext = '.webp';
                        else if (sub === 'gif') ext = '.gif';
                        else if (sub === 'svg+xml') ext = '.svg';
                        else ext = '.jpg';
                    }
                } else if (body.filename) {
                    const matchExt = path.extname(body.filename).toLowerCase();
                    if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(matchExt)) {
                        ext = matchExt === '.jpeg' ? '.jpg' : matchExt;
                    }
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

                if (!sourceUrl || (!sourceUrl.startsWith('http://') && !sourceUrl.startsWith('https://'))) {
                    setCors(res);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Invalid URL' }));
                }

                const fileName = `profile-${profileId}-${photoIndex}.jpg`;
                const targetPath = path.join(IMAGES_DIR, fileName);

                await downloadImage(sourceUrl, targetPath);

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
    
    // Resolve file path safely
    const filePath = path.normalize(path.join(ROOT, cleanUrl));

    if (!filePath.startsWith(ROOT)) {
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

            res.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Service-Worker-Allowed': '/'
            });

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
