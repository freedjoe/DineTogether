// =====================================================
//  DineTogether v3.1 — app.js
//  Real SQLite WASM · Photo Optimization · /_/admin
//  Deep Rose · Pink · Sultry Dark Theme
//  Enhanced Filters by Age · Complete Photos & Lightbox
//  Booking with Phone Numbers · Full Booking Manager
// =====================================================

'use strict';

// ===== Utilities =====
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function debounce(fn, ms = 200) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function todayISO() { return new Date().toISOString().split('T')[0]; }

const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect fill="#130010" width="100%" height="100%"/><text x="50%" y="50%" fill="#a0144a" font-family="sans-serif" font-size="16" text-anchor="middle" dy=".3em">DineTogether</text></svg>'
);

function imgFallback(el) { el.onerror = null; el.src = PLACEHOLDER; }
function mainPhoto(p) { return (p.photos && p.photos[0]) || p.image || PLACEHOLDER; }

function raf(fn) { requestAnimationFrame(fn); }

// ===== Default Seed Data for SQLite =====
const DEFAULT_PROFILES = [
    {
        id: 1, name: 'Sophie Laurent', age: 28,
        bio: 'Art curator and wine enthusiast. Love exploring hidden gem restaurants and deep conversations about life, culture, and everything in between.',
        cuisine: 'french', interests: ['art', 'food', 'travel'],
        location: 'Paris, France', likes: 184,
        photos: [
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1000&fit=crop&auto=format&q=85',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1000&fit=crop&auto=format&q=85',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=1000&fit=crop&auto=format&q=85',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1000&fit=crop&auto=format&q=85'
        ],
        available: true
    },
    {
        id: 2, name: 'Isabella Rossi', age: 26,
        bio: 'Chef and food blogger. I know all the best spots in town! Looking for someone to share culinary adventures with.',
        cuisine: 'italian', interests: ['food', 'travel', 'music'],
        location: 'Milan, Italy', likes: 142,
        photos: [
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=1000&fit=crop&auto=format&q=85',
            'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&h=1000&fit=crop&auto=format&q=85',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=1000&fit=crop&auto=format&q=85'
        ],
        available: true
    },
    {
        id: 3, name: 'Yuki Tanaka', age: 23,
        bio: 'Sushi lover and yoga instructor. Enjoy mindful conversations and discovering new flavors. Let\'s make dinner an experience!',
        cuisine: 'japanese', interests: ['fitness', 'food', 'art'],
        location: 'Tokyo, Japan', likes: 196,
        photos: [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1000&fit=crop&auto=format&q=85',
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1000&fit=crop&auto=format&q=85',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1000&fit=crop&auto=format&q=85'
        ],
        available: true
    },
    {
        id: 4, name: 'Valentina Garcia', age: 27,
        bio: 'Travel photographer and spice enthusiast. Always up for trying the hottest new restaurant in town!',
        cuisine: 'mexican', interests: ['travel', 'art', 'food'],
        location: 'Barcelona, Spain', likes: 165,
        photos: [
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=1000&fit=crop&auto=format&q=85',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=1000&fit=crop&auto=format&q=85',
            'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&h=1000&fit=crop&auto=format&q=85'
        ],
        available: true
    },
    {
        id: 5, name: 'Ananya Sharma', age: 31,
        bio: 'Tech entrepreneur and curry connoisseur. I can debate AI over appetizers and discuss philosophy over dessert.',
        cuisine: 'indian', interests: ['tech', 'food', 'travel'],
        location: 'London, UK', likes: 138,
        photos: [
            'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&h=1000&fit=crop&auto=format&q=85',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=1000&fit=crop&auto=format&q=85',
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1000&fit=crop&auto=format&q=85'
        ],
        available: true
    },
    {
        id: 6, name: 'Olivia Chen', age: 24,
        bio: 'Jazz singer and burger aficionado. Looking for someone to enjoy live music and late-night eats with.',
        cuisine: 'american', interests: ['music', 'food', 'art'],
        location: 'New York, USA', likes: 172,
        photos: [
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=1000&fit=crop&auto=format&q=85',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1000&fit=crop&auto=format&q=85',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1000&fit=crop&auto=format&q=85'
        ],
        available: true
    }
];

const DEFAULT_CLIENTS = [
    { id: 1, name: 'James Wilson', phone: '+1 202 555 0142', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format&q=80', joinDate: '2024-01-15' },
    { id: 2, name: 'Michael Brown', phone: '+44 7911 123456', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&auto=format&q=80', joinDate: '2024-02-20' },
    { id: 3, name: 'David Lee', phone: '+33 6 12 34 56 78', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format&q=80', joinDate: '2024-03-10' }
];

const DEFAULT_REQUESTS = [
    {
        id: 1, clientId: 1, clientName: 'James Wilson', clientPhone: '+1 202 555 0142',
        clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format&q=80',
        profileId: 1, profileName: 'Sophie Laurent',
        profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1000&fit=crop&auto=format&q=85',
        date: '2026-10-15', time: '19:30', restaurant: 'Le Petit Bistro',
        message: 'Would love to discuss art and try their famous duck confit!',
        status: 'pending', createdAt: '2026-09-28'
    },
    {
        id: 2, clientId: 2, clientName: 'Michael Brown', clientPhone: '+44 7911 123456',
        clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&auto=format&q=80',
        profileId: 3, profileName: 'Yuki Tanaka',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1000&fit=crop&auto=format&q=85',
        date: '2026-10-18', time: '20:00', restaurant: 'Sakura Sushi Bar',
        message: 'I\'ve been wanting to try authentic omakase. Would be great to learn about Japanese cuisine!',
        status: 'accepted', createdAt: '2026-09-27'
    }
];

// ===== State =====
let profiles = [], clients = [], requests = [];
let userLikedIds = new Set();
let currentGalleryIndex = 0, currentGalleryPhotos = [], selectedProfileId = null;
let currentFormPhotos = [];
let currentBookingFilter = 'all';

// ===== Device & IP Identification (Single Like per Device/IP) =====
let cachedUserKey = null;

function getDeviceId() {
    let devId = localStorage.getItem('dt_device_id');
    if (!devId) {
        devId = 'dev_' + (crypto.randomUUID ? crypto.randomUUID().slice(0, 16) : Math.random().toString(36).slice(2, 12) + Date.now().toString(36));
        localStorage.setItem('dt_device_id', devId);
    }
    return devId;
}

async function getUserKey() {
    if (cachedUserKey) return cachedUserKey;
    const devId = getDeviceId();
    let ip = localStorage.getItem('dt_client_ip') || '';

    if (!ip) {
        try {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 1200);
            const res = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal });
            clearTimeout(tid);
            if (res.ok) {
                const data = await res.json();
                if (data && data.ip) {
                    ip = String(data.ip).trim();
                    localStorage.setItem('dt_client_ip', ip);
                }
            }
        } catch (_) {}
    }

    cachedUserKey = ip ? `ip_${ip}` : devId;
    return cachedUserKey;
}

// ===== Photo Optimization Engine =====
async function optimizeImageFile(file, maxWidth = 800, maxHeight = 1000, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const origSizeKB = Math.round(file.size / 1024);
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
                const targetW = Math.round(width * ratio);
                const targetH = Math.round(height * ratio);

                const canvas = document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, targetW, targetH);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                const optSizeKB = Math.round((dataUrl.length * 3 / 4) / 1024);
                const savings = origSizeKB > 0 ? Math.round(((origSizeKB - optSizeKB) / origSizeKB) * 100) : 0;

                resolve({
                    dataUrl,
                    width: targetW,
                    height: targetH,
                    originalSizeKB: origSizeKB,
                    optimizedSizeKB: optSizeKB,
                    savings: Math.max(0, savings),
                    filename: file.name
                });
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ===== Aurora Canvas (Deep Rose / Magenta / Amber) =====
function initAurora() {
    const canvas = $('#aurora-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, t = 0;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', debounce(resize, 200));

    const blobs = [
        { x: 0.2, y: 0.3, r: 0.38, color: [255, 45, 120], speed: 0.0008 },
        { x: 0.8, y: 0.7, r: 0.32, color: [204, 26, 95], speed: 0.0006 },
        { x: 0.5, y: 0.1, r: 0.28, color: [255, 158, 181], speed: 0.001 },
    ];

    function draw() {
        ctx.clearRect(0, 0, w, h);
        t += 1;

        blobs.forEach(b => {
            const x = (b.x + Math.sin(t * b.speed) * 0.15) * w;
            const y = (b.y + Math.cos(t * b.speed * 0.7) * 0.12) * h;
            const radius = b.r * Math.min(w, h);
            const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
            grad.addColorStop(0, `rgba(${b.color.join(',')}, 0.20)`);
            grad.addColorStop(0.5, `rgba(${b.color.join(',')}, 0.07)`);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        });

        requestAnimationFrame(draw);
    }

    draw();
}

// ===== PWA =====
let deferredInstallPrompt = null;

function initPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('[SW] Registered:', reg.scope);
        }).catch(err => console.warn('[SW] Registration failed:', err));
    }

    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredInstallPrompt = e;
        const banner = $('#install-banner');
        if (banner && !sessionStorage.getItem('pwa-dismissed')) {
            banner.hidden = false;
            setTimeout(() => banner.classList.add('visible'), 300);
        }
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        const banner = $('#install-banner');
        if (banner) { banner.classList.remove('visible'); setTimeout(() => banner.hidden = true, 400); }
        showToast('App installed successfully! 🎉', 'success');
    });

    $('#btn-install')?.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') { deferredInstallPrompt = null; }
    });

    $('#btn-install-close')?.addEventListener('click', () => {
        const banner = $('#install-banner');
        banner.classList.remove('visible');
        setTimeout(() => banner.hidden = true, 400);
        sessionStorage.setItem('pwa-dismissed', '1');
    });
}

// ===== Loading Overlay =====
function hideLoading() {
    const overlay = $('#loading-overlay');
    if (!overlay) return;
    overlay.classList.add('fade-out');
    setTimeout(() => { overlay.classList.add('hidden'); }, 520);
}

// ===== Modal & Lightbox Helpers =====
function openOverlay(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('active');
    el.hidden = false;
    document.body.style.overflow = 'hidden';
}

function closeOverlay(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('active');
    el.hidden = true;
    if (!$$('.modal-overlay.active').length) document.body.style.overflow = '';
}

let lightboxSwipeAttached = false;
function setupLightboxSwipe() {
    const lightbox = $('#lightbox-modal');
    if (!lightbox || lightboxSwipeAttached) return;
    lightboxSwipeAttached = true;

    let startX = 0, startY = 0;
    lightbox.addEventListener('touchstart', e => {
        if (!e.touches || e.touches.length === 0) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    lightbox.addEventListener('touchend', e => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        const diffX = e.changedTouches[0].clientX - startX;
        const diffY = e.changedTouches[0].clientY - startY;

        // Pull down gesture to dismiss on mobile
        if (diffY > 60 && Math.abs(diffY) > Math.abs(diffX)) {
            closeLightbox();
            return;
        }

        // Swipe horizontal to browse photos
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40 && currentGalleryPhotos.length > 1) {
            if (diffX < 0) navigateGallery(1);
            else navigateGallery(-1);
            const nextSrc = currentGalleryPhotos[currentGalleryIndex];
            const img = $('#lightbox-img');
            if (img && nextSrc) img.src = nextSrc;
        }
    }, { passive: true });
}

function openLightbox(imgSrc, caption = '') {
    const img = $('#lightbox-img');
    const cap = $('#lightbox-caption');
    if (img) img.src = imgSrc;
    if (cap) cap.textContent = caption;
    openOverlay('lightbox-modal');
    setupLightboxSwipe();
}

function closeLightbox() {
    closeOverlay('lightbox-modal');
}

// ===== Route Handling (Admin on /_/admin) =====
function isCurrentRouteAdmin() {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    return hash === '#/_/admin' || hash === '#/admin' || path.endsWith('/_/admin') || path.endsWith('/_/admin/');
}

function checkRoute() {
    if (isCurrentRouteAdmin()) {
        showPage('admin', false);
    } else {
        showPage('client', false);
    }
}

// ===== Page Navigation =====
function showPage(page, updateHash = true) {
    $$('.page').forEach(p => { p.classList.remove('active'); p.hidden = true; });

    if (page === 'client') {
        const view = $('#client-view');
        view.classList.add('active'); view.hidden = false;
        if (updateHash && window.location.hash.includes('admin')) {
            window.location.hash = '';
        }
        renderProfiles();
    } else {
        const view = $('#admin-view');
        view.classList.add('active'); view.hidden = false;
        if (updateHash && !window.location.hash.includes('admin')) {
            window.location.hash = '#/_/admin';
        }
        renderAdminProfiles();
        renderAdminRequests();
        renderAdminClients();
        renderDatabaseStats();
        updateRequestBadge();
        updateQuickStats();
    }
}

function switchAdminTab(tab) {
    $$('.admin-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    $$('.admin-panel').forEach(p => { p.classList.remove('active'); p.hidden = true; });
    const tabBtn = document.getElementById(`tab-${tab}`);
    const panel = document.getElementById(`admin-${tab}`);
    if (tabBtn) { tabBtn.classList.add('active'); tabBtn.setAttribute('aria-selected', 'true'); }
    if (panel) { panel.classList.add('active'); panel.hidden = false; }

    if (tab === 'database') {
        renderDatabaseStats();
    }
}

// ===== Render Client Profiles with Age Filter =====
function renderProfiles() {
    const grid = $('#profiles-grid');
    if (!grid) return;

    const ageFilter = $('#filter-age')?.value || '';
    const interestFilter = $('#filter-interest')?.value || '';
    const searchQuery = ($('#filter-search')?.value || '').toLowerCase().trim();

    const filtered = profiles.filter(p => {
        if (ageFilter) {
            const age = Number(p.age);
            if (ageFilter === '18-24' && (age < 18 || age > 24)) return false;
            if (ageFilter === '25-29' && (age < 25 || age > 29)) return false;
            if (ageFilter === '30-34' && (age < 30 || age > 34)) return false;
            if (ageFilter === '35+' && age < 35) return false;
        }
        if (interestFilter && !(p.interests || []).includes(interestFilter)) return false;
        if (searchQuery) {
            const hay = `${p.name} ${p.bio} ${p.location} ${(p.interests || []).join(' ')}`.toLowerCase();
            if (!hay.includes(searchQuery)) return false;
        }
        return true;
    });

    const clearBtn = $('#search-clear');
    if (clearBtn) clearBtn.hidden = !searchQuery;

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <span class="empty-state-icon">🔍</span>
                <h3>No companions found</h3>
                <p>Try adjusting your age or interest filters</p>
            </div>`;
        return;
    }

    const html = filtered.map(p => {
        const photoCount = p.photos ? p.photos.length : 1;
        const photo = mainPhoto(p);
        const name = escapeHtml(p.name);
        const bio = escapeHtml(p.bio);
        const location = escapeHtml(p.location);
        const tags = (p.interests || []).map(i => `<span class="tag">${escapeHtml(i)}</span>`).join('');

        return `
            <article class="profile-card" role="listitem" data-action="open-profile" data-id="${p.id}" tabindex="0" aria-label="View ${name}'s profile">
                <div class="profile-card-media">
                    <img src="${escapeHtml(photo)}" alt="${name}" class="profile-card-image" loading="lazy" decoding="async" width="400" height="500">
                    <div class="profile-card-overlay" aria-hidden="true"></div>
                    ${p.available ? '<span class="availability-badge">Available</span>' : ''}
                    ${photoCount > 1 ? `<span class="photo-count" aria-label="${photoCount} photos">📷 ${photoCount}</span>` : ''}
                </div>
                <div class="profile-card-body">
                    <div class="profile-card-name">${name}</div>
                    <div class="profile-card-age">
                        <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        ${p.age} years old · ${location}
                    </div>
                    <div class="profile-card-bio">${bio}</div>
                    <div class="profile-card-tags">${tags}</div>
                    <div class="profile-card-footer">
                        <button class="profile-card-likes ${userLikedIds.has(p.id) ? 'liked' : ''}" type="button" data-action="like-profile" data-id="${p.id}" title="${userLikedIds.has(p.id) ? 'Undo like for ' + name : 'Like ' + name}" aria-pressed="${userLikedIds.has(p.id)}">
                            <span class="heart-icon">${userLikedIds.has(p.id) ? '❤️' : '🤍'}</span>
                            <span class="likes-count" id="card-likes-${p.id}">${p.likes || 0}</span>
                        </button>
                        <button class="profile-card-book" type="button" data-action="book" data-id="${p.id}">Book Now</button>
                    </div>
                </div>
            </article>`;
    }).join('');

    grid.innerHTML = html;
    grid.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', () => imgFallback(img), { once: true });
    });
}

const debouncedRenderProfiles = debounce(renderProfiles, 180);

// ===== Profile Detail Modal with Complete Photo & Lightbox =====
function openProfileModal(id) {
    const profile = profiles.find(p => p.id === id);
    if (!profile) return;

    selectedProfileId = id;
    currentGalleryPhotos = profile.photos?.length ? profile.photos : [profile.image || PLACEHOLDER];
    currentGalleryIndex = 0;

    const isLiked = userLikedIds.has(profile.id);
    const name = escapeHtml(profile.name);
    const content = $('#modal-content');
    const multi = currentGalleryPhotos.length > 1;
    const curPhoto = currentGalleryPhotos[0];

    content.innerHTML = `
        <div class="photo-gallery">
            <div class="gallery-blur-bg" id="gallery-blur-bg" style="background-image:url('${escapeHtml(curPhoto)}')"></div>
            <img src="${escapeHtml(curPhoto)}" alt="${name}" class="gallery-main" id="gallery-main-img" width="700" height="460" data-action="open-lightbox" title="Click to view complete full photo">
            <div class="gallery-overlay" aria-hidden="true"></div>
            <button class="btn-full-photo" type="button" data-action="open-lightbox" title="View complete full photo">⛶ Full Photo</button>
            ${multi ? `
                <button class="gallery-nav gallery-prev" type="button" data-action="gallery-prev" aria-label="Previous photo">&#10094;</button>
                <button class="gallery-nav gallery-next" type="button" data-action="gallery-next" aria-label="Next photo">&#10095;</button>
                <span class="gallery-counter" id="gallery-counter">1 / ${currentGalleryPhotos.length}</span>
            ` : ''}
        </div>
        ${multi ? `
            <div class="gallery-thumbnails" id="gallery-thumbnails">
                ${currentGalleryPhotos.map((photo, i) => `
                    <img src="${escapeHtml(photo)}" alt="Photo ${i + 1}" class="${i === 0 ? 'active' : ''}"
                         data-action="gallery-thumb" data-index="${i}" loading="lazy" decoding="async" width="62" height="62">
                `).join('')}
            </div>
        ` : ''}
        <div class="modal-profile-body">
            <h2 class="modal-profile-name" id="modal-profile-title">${name}</h2>
            <div class="modal-profile-meta">
                <span>🎂 ${profile.age} years old</span>
                <span class="meta-sep">·</span>
                <span>📍 ${escapeHtml(profile.location)}</span>
                <span class="meta-sep">·</span>
                <span class="modal-meta-likes"><span class="heart-pulse">${isLiked ? '❤️' : '🤍'}</span> <strong id="modal-likes-count">${profile.likes || 0}</strong> likes</span>
            </div>
            <p class="modal-profile-bio">${escapeHtml(profile.bio)}</p>
            <div class="modal-profile-details">
                <div class="detail-item">
                    <div class="detail-label">Age &amp; Location</div>
                    <div class="detail-value">${profile.age} years · ${escapeHtml(profile.location)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Availability</div>
                    <div class="detail-value" style="color:${profile.available ? 'var(--success)' : 'var(--danger)'}">
                        ${profile.available ? '✅ Available' : '⛔ Unavailable'}
                    </div>
                </div>
            </div>
            <div class="modal-profile-tags">
                ${(profile.interests || []).map(i => `<span class="tag">${escapeHtml(i)}</span>`).join('')}
            </div>

            <div class="like-section">
                <div class="like-section-content">
                    <div class="like-section-title">${isLiked ? 'You Liked ' + name : 'Show Love for ' + name}</div>
                    <p class="like-section-sub" id="modal-like-sub">${isLiked ? 'Tap again if you want to undo your like' : 'Tap the heart if you\'d love to dine with ' + name}</p>
                </div>
                <button class="btn-like-large ${isLiked ? 'liked' : ''}" type="button" data-action="like-profile-modal" data-id="${profile.id}" title="${isLiked ? 'Click to undo like' : 'Click to like'}" aria-pressed="${isLiked}">
                    <span class="heart-bounce">${isLiked ? '❤️' : '🤍'}</span>
                    <span class="like-btn-label">${isLiked ? 'Liked' : 'Like'}</span>
                    <span class="like-pill-count" id="modal-btn-likes">${profile.likes || 0}</span>
                </button>
            </div>

            <div class="modal-profile-actions">
                <button class="btn btn-primary" type="button" data-action="book-from-modal" data-id="${profile.id}">🍽️ Book for Dinner</button>
                <button class="btn btn-secondary" type="button" data-action="close-profile">Close</button>
            </div>
        </div>`;

    content.querySelectorAll('img').forEach(img => img.addEventListener('error', () => imgFallback(img), { once: true }));
    openOverlay('profile-modal');
    setupGallerySwipe();
}

function setupGallerySwipe() {
    const gallery = $('.photo-gallery');
    if (!gallery) return;

    let startX = 0, startY = 0;
    gallery.addEventListener('touchstart', e => {
        if (!e.touches || e.touches.length === 0) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    gallery.addEventListener('touchend', e => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        const diffX = e.changedTouches[0].clientX - startX;
        const diffY = e.changedTouches[0].clientY - startY;

        // Check horizontal swipe threshold
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
            if (diffX < 0) navigateGallery(1);
            else navigateGallery(-1);
        }
    }, { passive: true });
}

function navigateGallery(dir) {
    const total = currentGalleryPhotos.length;
    if (!total) return;
    currentGalleryIndex = (currentGalleryIndex + dir + total) % total;
    updateGalleryDisplay();
}

function setGalleryIndex(idx) { currentGalleryIndex = idx; updateGalleryDisplay(); }

function updateGalleryDisplay() {
    const mainImg = $('#gallery-main-img');
    const blurBg = $('#gallery-blur-bg');
    const photo = currentGalleryPhotos[currentGalleryIndex];
    if (mainImg) {
        mainImg.style.opacity = '0';
        setTimeout(() => {
            mainImg.src = photo;
            if (blurBg) blurBg.style.backgroundImage = `url('${photo}')`;
            mainImg.style.opacity = '1';
        }, 120);
    }
    const counter = $('#gallery-counter');
    if (counter) counter.textContent = `${currentGalleryIndex + 1} / ${currentGalleryPhotos.length}`;
    $$('#gallery-thumbnails img').forEach((thumb, i) => thumb.classList.toggle('active', i === currentGalleryIndex));
}

async function handleLikeProfile(id, triggerEl) {
    try {
        const key = await getUserKey();
        const res = await DB.profiles.toggleLike(id, key);
        const p = profiles.find(x => x.id === id);
        if (p) p.likes = res.likes;

        if (res.liked) {
            userLikedIds.add(id);
            showToast(`You liked ${p?.name || 'companion'}! ❤️`, 'success');
        } else {
            userLikedIds.delete(id);
            showToast(`Removed like for ${p?.name || 'companion'}`, 'info');
        }

        const cardBtn = triggerEl ? triggerEl.closest('.profile-card-likes') : $(`[data-action="like-profile"][data-id="${id}"]`);
        if (cardBtn) {
            cardBtn.classList.toggle('liked', res.liked);
            cardBtn.setAttribute('aria-pressed', res.liked ? 'true' : 'false');
            cardBtn.title = res.liked ? `Undo like for ${p?.name || ''}` : `Like ${p?.name || ''}`;
            const heart = cardBtn.querySelector('.heart-icon');
            if (heart) heart.textContent = res.liked ? '❤️' : '🤍';
            const cntSpan = cardBtn.querySelector('.likes-count');
            if (cntSpan) cntSpan.textContent = res.likes;
            if (res.liked) {
                cardBtn.classList.add('pop');
                setTimeout(() => cardBtn.classList.remove('pop'), 450);
            }
        }

        if (selectedProfileId === id) {
            updateModalLikeUI(id, res.liked, res.likes);
        }
    } catch (e) {
        console.error('Like toggle error:', e);
        showToast('Failed to update like', 'error');
    }
}

async function handleLikeProfileModal(id, triggerBtn) {
    try {
        const key = await getUserKey();
        const res = await DB.profiles.toggleLike(id, key);
        const p = profiles.find(x => x.id === id);
        if (p) p.likes = res.likes;

        if (res.liked) {
            userLikedIds.add(id);
            showToast(`You liked ${p?.name || 'companion'}! ❤️`, 'success');
        } else {
            userLikedIds.delete(id);
            showToast(`Removed like for ${p?.name || 'companion'}`, 'info');
        }

        updateModalLikeUI(id, res.liked, res.likes);

        const cardBtn = $(`[data-action="like-profile"][data-id="${id}"]`);
        if (cardBtn) {
            cardBtn.classList.toggle('liked', res.liked);
            cardBtn.setAttribute('aria-pressed', res.liked ? 'true' : 'false');
            cardBtn.title = res.liked ? `Undo like for ${p?.name || ''}` : `Like ${p?.name || ''}`;
            const heart = cardBtn.querySelector('.heart-icon');
            if (heart) heart.textContent = res.liked ? '❤️' : '🤍';
            const cntSpan = cardBtn.querySelector('.likes-count');
            if (cntSpan) cntSpan.textContent = res.likes;
            if (res.liked) {
                cardBtn.classList.add('pop');
                setTimeout(() => cardBtn.classList.remove('pop'), 450);
            }
        }
    } catch (e) {
        console.error('Like toggle error:', e);
        showToast('Failed to update like', 'error');
    }
}

function updateModalLikeUI(id, liked, count) {
    const p = profiles.find(x => x.id === id);
    const name = p?.name || 'companion';
    const modalCnt = $('#modal-likes-count');
    if (modalCnt) modalCnt.textContent = count;
    const btnCnt = $('#modal-btn-likes');
    if (btnCnt) btnCnt.textContent = count;

    const btn = $('[data-action="like-profile-modal"]');
    if (btn) {
        btn.classList.toggle('liked', liked);
        btn.setAttribute('aria-pressed', liked ? 'true' : 'false');
        btn.title = liked ? 'Click to undo like' : 'Click to like';
        const heart = btn.querySelector('.heart-bounce');
        if (heart) heart.textContent = liked ? '❤️' : '🤍';
        const label = btn.querySelector('.like-btn-label');
        if (label) label.textContent = liked ? 'Liked' : 'Like';
        if (liked) {
            btn.classList.add('pop');
            setTimeout(() => btn.classList.remove('pop'), 450);
        }
    }

    const title = $('.like-section-title');
    if (title) title.textContent = liked ? `You Liked ${name}` : `Show Love for ${name}`;
    const sub = $('#modal-like-sub');
    if (sub) sub.textContent = liked ? 'Tap again if you want to undo your like' : `Tap the heart if you'd love to dine with ${name}`;
    const metaPulse = $('.modal-meta-likes .heart-pulse');
    if (metaPulse) metaPulse.textContent = liked ? '❤️' : '🤍';
}

function closeModal() { closeOverlay('profile-modal'); }

// ===== Booking with Phone Number =====
function openBookingModal(profileId) {
    selectedProfileId = profileId;
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    const content = $('#booking-content');
    content.innerHTML = `
        <div class="booking-body">
            <h2 class="booking-title" id="booking-title">
                Book <span style="background:var(--grad-rose);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">${escapeHtml(profile.name)}</span>
            </h2>
            <form class="booking-form" id="booking-form">
                <div class="form-group">
                    <label for="booking-name">Your Full Name *</label>
                    <input type="text" id="booking-name" required placeholder="e.g. Alexander Vance" autocomplete="name">
                </div>
                <div class="form-group">
                    <label for="booking-phone">Your Phone / WhatsApp Number *</label>
                    <input type="tel" id="booking-phone" required placeholder="e.g. +1 234 567 8900" autocomplete="tel">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="booking-date">Date *</label>
                        <input type="date" id="booking-date" required min="${todayISO()}">
                    </div>
                    <div class="form-group">
                        <label for="booking-time">Time *</label>
                        <input type="time" id="booking-time" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="booking-restaurant">Restaurant / Venue *</label>
                    <input type="text" id="booking-restaurant" required placeholder="Where would you like to dine?">
                </div>
                <div class="form-group">
                    <label for="booking-message">Personal Message (optional)</label>
                    <textarea id="booking-message" placeholder="Add a note or special requests..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary">🍽️ Send Dining Request</button>
            </form>
        </div>`;

    openOverlay('booking-modal');
}

function closeBookingModal() { closeOverlay('booking-modal'); }

async function submitBooking(event) {
    event.preventDefault();

    const name = $('#booking-name').value.trim();
    const phone = $('#booking-phone').value.trim();
    const date = $('#booking-date').value;
    const time = $('#booking-time').value;
    const restaurant = $('#booking-restaurant').value.trim();
    const message = $('#booking-message').value.trim();

    const submitBtn = event.target.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving booking to SQLite…';

    try {
        let client = await DB.clients.byPhone(phone);
        if (!client) {
            client = await DB.clients.save({
                name, phone,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff2d78&color=fff&size=100`,
                joinDate: todayISO()
            });
        }

        const profile = profiles.find(p => p.id === selectedProfileId);
        if (!profile) return;

        await DB.requests.save({
            clientId: client.id,
            clientName: client.name,
            clientPhone: phone,
            clientAvatar: client.avatar,
            profileId: profile.id,
            profileName: profile.name,
            profileImage: mainPhoto(profile),
            date, time, restaurant, message,
            status: 'pending',
            createdAt: todayISO()
        });

        [clients, requests] = await Promise.all([DB.clients.all(), DB.requests.all()]);

        closeBookingModal();
        showToast('Dining request sent & saved in SQLite! 🍽️', 'success');
        updateRequestBadge();
        updateQuickStats();
    } catch (e) {
        console.error('Booking error:', e);
        showToast('Failed to save request to database', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🍽️ Send Dining Request';
    }
}

// ===== Admin Renders =====
function renderAdminProfiles() {
    const list = $('#admin-profiles-list');
    if (!list) return;
    if (profiles.length === 0) {
        list.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="empty-state-icon">👤</span><h3>No profiles in SQLite yet</h3><p>Add your first companion profile</p></div>`;
        return;
    }
    list.innerHTML = profiles.map(p => `
        <div class="admin-profile-card">
            <img src="${escapeHtml(mainPhoto(p))}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async" width="72" height="72">
            <div class="admin-profile-info">
                <div class="admin-profile-name">${escapeHtml(p.name)}</div>
                <div class="admin-profile-meta">${p.age} yrs · ❤️ ${p.likes || 0} likes · 📷 ${p.photos?.length || 1}<br>${escapeHtml(p.location)}</div>
                <div class="admin-profile-actions">
                    <button class="btn-edit" type="button" data-action="edit-profile" data-id="${p.id}">✏️ Edit &amp; Photos</button>
                    <button class="btn-delete" type="button" data-action="delete-profile" data-id="${p.id}">🗑️ Delete</button>
                </div>
            </div>
        </div>`).join('');
    list.querySelectorAll('img').forEach(img => img.addEventListener('error', () => imgFallback(img), { once: true }));
}

// ===== Admin Booking List Management =====
function renderAdminRequests() {
    const list = $('#admin-requests-list');
    if (!list) return;

    // Update count pills
    const cntAll = requests.length;
    const cntPending = requests.filter(r => r.status === 'pending').length;
    const cntAccepted = requests.filter(r => r.status === 'accepted').length;
    const cntDeclined = requests.filter(r => r.status === 'declined' || r.status === 'cancelled').length;

    const elAll = $('#cnt-all'); if (elAll) elAll.textContent = cntAll;
    const elPen = $('#cnt-pending'); if (elPen) elPen.textContent = cntPending;
    const elAcc = $('#cnt-accepted'); if (elAcc) elAcc.textContent = cntAccepted;
    const elDec = $('#cnt-declined'); if (elDec) elDec.textContent = cntDeclined;

    const filtered = requests.filter(r => {
        if (currentBookingFilter === 'all') return true;
        if (currentBookingFilter === 'pending') return r.status === 'pending';
        if (currentBookingFilter === 'accepted') return r.status === 'accepted';
        if (currentBookingFilter === 'declined') return r.status === 'declined' || r.status === 'cancelled';
        return true;
    });

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">📋</span>
                <h3>No ${currentBookingFilter === 'all' ? '' : currentBookingFilter} bookings</h3>
                <p>New reservations and booking requests will appear here</p>
            </div>`;
        return;
    }

    list.innerHTML = filtered.map(r => {
        const phone = r.clientPhone || r.phone || 'Phone not provided';
        const statusClass = r.status === 'accepted' ? 'accepted' : (r.status === 'declined' || r.status === 'cancelled' ? 'declined' : 'pending');
        const statusLabel = r.status === 'accepted' ? '✅ Accepted' : (r.status === 'declined' || r.status === 'cancelled' ? '❌ Cancelled' : '⏳ Pending');

        return `
            <div class="request-card">
                <img src="${escapeHtml(r.profileImage)}" alt="${escapeHtml(r.profileName)}" loading="lazy" decoding="async" width="88" height="88">
                <div class="request-info">
                    <div class="request-header">
                        <div class="request-client">
                            ${escapeHtml(r.clientName)}
                            <span class="request-arrow">→</span>
                            ${escapeHtml(r.profileName)}
                        </div>
                        <span class="request-status status-${statusClass}">${statusLabel}</span>
                    </div>

                    <div>
                        <span class="request-phone">📞 ${escapeHtml(phone)}</span>
                    </div>

                    <div class="request-details">
                        <span>📅 ${escapeHtml(r.date)} at ${escapeHtml(r.time)}</span>
                        <span>📍 ${escapeHtml(r.restaurant)}</span>
                    </div>

                    ${r.message ? `<div class="request-message">"${escapeHtml(r.message)}"</div>` : ''}

                    <div class="request-actions">
                        ${r.status === 'pending' ? `
                            <button class="btn-success" type="button" data-action="set-booking-status" data-id="${r.id}" data-status="accepted">✅ Accept</button>
                            <button class="btn-danger" type="button" data-action="set-booking-status" data-id="${r.id}" data-status="declined">❌ Cancel / Decline</button>
                            <button class="btn-warning" type="button" data-action="propose" data-id="${r.id}">🔄 Propose Alternative</button>
                        ` : ''}
                        ${r.status === 'accepted' ? `
                            <button class="btn-danger" type="button" data-action="set-booking-status" data-id="${r.id}" data-status="declined">❌ Cancel Booking</button>
                            <button class="btn-pending" type="button" data-action="set-booking-status" data-id="${r.id}" data-status="pending">⏳ Move to Pending</button>
                        ` : ''}
                        ${(r.status === 'declined' || r.status === 'cancelled') ? `
                            <button class="btn-success" type="button" data-action="set-booking-status" data-id="${r.id}" data-status="accepted">✅ Re-accept</button>
                            <button class="btn-pending" type="button" data-action="set-booking-status" data-id="${r.id}" data-status="pending">⏳ Move to Pending</button>
                        ` : ''}
                        <button class="btn-delete" type="button" data-action="delete-booking" data-id="${r.id}" style="margin-left:auto" title="Delete from SQLite">🗑️ Delete</button>
                    </div>
                </div>
            </div>`;
    }).join('');

    list.querySelectorAll('img').forEach(img => img.addEventListener('error', () => imgFallback(img), { once: true }));
}

async function updateRequestStatus(requestId, status) {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;
    request.status = status;
    try {
        await DB.requests.save(request);
        requests = await DB.requests.all();
        renderAdminRequests();
        updateRequestBadge();
        updateQuickStats();
        renderDatabaseStats();
        const msg = status === 'accepted' ? 'Booking Accepted! ✅' : (status === 'declined' ? 'Booking Cancelled ❌' : 'Booking moved to Pending ⏳');
        showToast(msg, status === 'accepted' ? 'success' : (status === 'declined' ? 'error' : 'info'));
    } catch (e) {
        showToast('Failed to update request', 'error');
    }
}

async function deleteBookingRequest(requestId) {
    if (!confirm('Are you sure you want to delete this booking request from SQLite?')) return;
    try {
        await DB.requests.delete(requestId);
        requests = await DB.requests.all();
        renderAdminRequests();
        updateRequestBadge();
        updateQuickStats();
        renderDatabaseStats();
        showToast('Booking deleted from SQLite database', 'info');
    } catch (e) {
        showToast('Failed to delete booking', 'error');
    }
}

function renderAdminClients() {
    const list = $('#admin-clients-list');
    if (!list) return;
    if (clients.length === 0) {
        list.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="empty-state-icon">👥</span><h3>No clients yet</h3><p>Registered clients will appear here</p></div>`;
        return;
    }
    list.innerHTML = clients.map(c => {
        const clientRequests = requests.filter(r => r.clientId === c.id);
        const accepted = clientRequests.filter(r => r.status === 'accepted').length;
        const pending = clientRequests.filter(r => r.status === 'pending').length;
        return `
            <div class="client-card">
                <div class="client-avatar-wrap">
                    <img src="${escapeHtml(c.avatar)}" alt="${escapeHtml(c.name)}" loading="lazy" decoding="async" width="72" height="72">
                    <div class="client-avatar-ring" aria-hidden="true"></div>
                </div>
                <div class="client-name">${escapeHtml(c.name)}</div>
                <div class="client-phone" style="font-size:0.8rem;color:var(--rose-soft);margin-bottom:0.6rem;font-weight:600">
                    📞 ${escapeHtml(c.phone || 'No phone')}
                </div>
                <div class="client-stats">
                    <span class="client-stat-item">📅 ${escapeHtml(c.joinDate)}</span>
                    <span class="client-stat-item">✅ ${accepted} dinner${accepted !== 1 ? 's' : ''}</span>
                    ${pending ? `<span class="client-stat-item">⏳ ${pending} pending</span>` : ''}
                </div>
            </div>`;
    }).join('');
    list.querySelectorAll('img').forEach(img => img.addEventListener('error', () => imgFallback(img), { once: true }));
}

function updateRequestBadge() {
    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const badge = $('#request-badge');
    if (!badge) return;
    badge.textContent = pendingCount;
    badge.hidden = pendingCount === 0;
}

function updateQuickStats() {
    const qs = {
        'qs-profiles': profiles.length,
        'qs-pending': requests.filter(r => r.status === 'pending').length,
        'qs-clients': clients.length
    };
    Object.entries(qs).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });
}

// ===== SQLite Database Manager Tab =====
function renderDatabaseStats() {
    try {
        const stats = DB.getTableStats();
        const pEl = $('#db-stat-profiles');
        const cEl = $('#db-stat-clients');
        const rEl = $('#db-stat-requests');
        const phEl = $('#db-stat-photos');
        if (pEl) pEl.textContent = `${stats.profiles} rows`;
        if (cEl) cEl.textContent = `${stats.clients} rows`;
        if (rEl) rEl.textContent = `${stats.requests} rows`;

        DB.photos.all().then(rows => {
            if (phEl) phEl.textContent = `${rows.length} files`;
        }).catch(() => {});
    } catch (e) {
        console.error('Error fetching database stats:', e);
    }
}

function handleDownloadSQLite() {
    try {
        const bytes = DB.exportSQLite();
        if (!bytes) { showToast('No SQLite database loaded', 'error'); return; }
        const blob = new Blob([bytes], { type: 'application/x-sqlite3' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dinetogether_${todayISO()}.sqlite`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Downloaded dinetogether.sqlite! You can open it in DB Browser for SQLite.', 'success', 4500);
    } catch (e) {
        showToast('Export failed: ' + e.message, 'error');
    }
}

async function handleExportJSON() {
    try {
        const json = await DB.exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dinetogether_backup_${todayISO()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Exported database as JSON!', 'success');
    } catch (e) {
        showToast('Export failed: ' + e.message, 'error');
    }
}

function handleRunSQL() {
    const input = $('#sql-query-input');
    const resultEl = $('#sql-query-result');
    if (!input || !resultEl) return;
    const sql = input.value.trim();
    if (!sql) return;

    try {
        const isSelect = sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('PRAGMA');
        if (isSelect) {
            const rows = DB.queryRaw(sql);
            if (!rows.length) {
                resultEl.innerHTML = '<span style="color:var(--text-muted)">Query returned 0 rows.</span>';
                return;
            }
            const cols = Object.keys(rows[0]);
            let html = '<table class="sql-table"><thead><tr>';
            cols.forEach(c => html += `<th>${escapeHtml(c)}</th>`);
            html += '</tr></thead><tbody>';
            rows.slice(0, 100).forEach(r => {
                html += '<tr>';
                cols.forEach(c => {
                    const val = typeof r[c] === 'object' ? JSON.stringify(r[c]) : String(r[c] ?? '');
                    html += `<td>${escapeHtml(val)}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table>';
            if (rows.length > 100) html += `<div style="color:var(--text-dim);margin-top:0.4rem;font-size:0.75rem">Showing 100 of ${rows.length} rows</div>`;
            resultEl.innerHTML = html;
            showToast(`Query executed on SQLite! (${rows.length} rows)`, 'success');
        } else {
            DB.runRaw(sql);
            resultEl.innerHTML = '<span style="color:var(--success)">Statement executed successfully & database persisted!</span>';
            renderDatabaseStats();
            showToast('Statement executed & saved into SQLite!', 'success');
        }
    } catch (err) {
        resultEl.innerHTML = `<span style="color:var(--danger)">SQL Error: ${escapeHtml(err.message)}</span>`;
        showToast('SQL syntax error', 'error');
    }
}

// ===== Profile Photo Studio & CRUD =====
function renderFormPhotos() {
    const grid = $('#pf-photo-grid');
    if (!grid) return;
    if (currentFormPhotos.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:1rem;color:var(--text-dim);font-size:0.8rem">No photos uploaded yet. Drop image files or paste an image URL below.</div>';
        return;
    }
    grid.innerHTML = currentFormPhotos.map((url, i) => `
        <div class="photo-thumb" data-index="${i}">
            <img src="${escapeHtml(url)}" alt="Photo ${i + 1}" loading="lazy">
            <div class="photo-thumb-overlay">
                ${i > 0 ? `<button type="button" class="btn-make-cover" data-action="make-cover-photo" data-index="${i}" title="Make Cover Photo" style="background:var(--rose);color:#fff;border-radius:4px;padding:3px 6px;font-size:0.65rem;font-weight:600">★ Main</button>` : ''}
                <button type="button" class="photo-thumb-del" data-action="delete-form-photo" data-index="${i}" title="Delete photo">✕</button>
            </div>
            ${i === 0 ? '<span class="photo-thumb-main-badge">Cover</span>' : ''}
        </div>
    `).join('');
    grid.querySelectorAll('img').forEach(img => img.addEventListener('error', () => imgFallback(img), { once: true }));
}

async function handlePhotoUpload(files) {
    if (!files || !files.length) return;
    const progressEl = $('#pf-upload-progress');
    const statusText = $('#pf-upload-status');
    if (progressEl) progressEl.hidden = false;

    let processed = 0;
    for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        processed++;
        if (statusText) statusText.textContent = `Optimizing ${file.name} (${processed}/${files.length})…`;
        try {
            const opt = await optimizeImageFile(file);
            currentFormPhotos.push(opt.dataUrl);
            await DB.photos.add(null, opt.dataUrl, {
                filename: opt.filename,
                width: opt.width,
                height: opt.height,
                size_kb: opt.optimizedSizeKB
            });
            showToast(`Photo optimized: ${opt.originalSizeKB}KB → ${opt.optimizedSizeKB}KB (-${opt.savings}% saved!)`, 'success', 3500);
        } catch (err) {
            console.error('Image optimization failed:', err);
            showToast(`Failed to optimize ${file.name}`, 'error');
        }
    }

    if (progressEl) progressEl.hidden = true;
    renderFormPhotos();
}

function openAddProfileModal() {
    currentFormPhotos = [];
    const content = $('#profile-form-content');
    content.innerHTML = profileFormHTML();
    setupProfileFormHandlers();
    renderFormPhotos();
    openOverlay('profile-form-modal');
}

function openEditProfileModal(id) {
    const profile = profiles.find(p => p.id === id);
    if (!profile) return;
    currentFormPhotos = profile.photos?.length ? [...profile.photos] : (profile.image ? [profile.image] : []);
    const content = $('#profile-form-content');
    content.innerHTML = profileFormHTML(profile);
    setupProfileFormHandlers();
    renderFormPhotos();
    openOverlay('profile-form-modal');
}

function profileFormHTML(profile = null) {
    const isEdit = !!profile;

    return `
        <form class="profile-form" id="profile-form" data-edit-id="${isEdit ? profile.id : ''}">
            <h2 id="profile-form-title">${isEdit ? '✏️ Edit Profile' : '✨ Add New Companion'}</h2>

            <div class="form-section-label">Basic Information</div>
            <div class="form-group">
                <label for="pf-name">Full Name *</label>
                <input type="text" id="pf-name" required placeholder="Enter full name" value="${escapeHtml(profile?.name || '')}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="pf-age">Age *</label>
                    <input type="number" id="pf-age" required min="18" max="99" placeholder="Age" value="${profile?.age ?? ''}">
                </div>
                <div class="form-group">
                    <label for="pf-location">Location *</label>
                    <input type="text" id="pf-location" required placeholder="City, Country" value="${escapeHtml(profile?.location || '')}">
                </div>
            </div>
            <div class="form-group">
                <label for="pf-bio">Bio *</label>
                <textarea id="pf-bio" required placeholder="Write a charming, engaging bio...">${escapeHtml(profile?.bio || '')}</textarea>
            </div>

            <div class="form-section-label">Preferences</div>
            <div class="form-group">
                <label for="pf-interests">Interests (comma separated)</label>
                <input type="text" id="pf-interests" placeholder="art, music, travel, wine, fitness" value="${escapeHtml((profile?.interests || []).join(', '))}">
            </div>

            <div class="form-section-label">Photo Gallery &amp; Optimization Studio</div>
            <p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem">
                Uploaded photos are auto-optimized to 800×1000 portrait ratio with JPEG compression for peak quality and speed.
            </p>
            
            <div class="photo-grid" id="pf-photo-grid"></div>

            <div class="photo-upload-zone" id="pf-upload-zone" style="margin-top:0.75rem">
                <input type="file" id="pf-file-input" accept="image/*" multiple aria-label="Upload photos">
                <div class="photo-upload-icon">📸</div>
                <div class="photo-upload-text">Click or drag photos here to upload</div>
                <div class="photo-upload-sub">Auto-downscales &amp; compresses image file size for crisp portrait display</div>
            </div>

            <div class="photo-upload-progress" id="pf-upload-progress" hidden>
                <div class="spinner"></div>
                <span id="pf-upload-status">Optimizing photo…</span>
            </div>

            <div style="display:flex;gap:0.5rem;margin-top:0.6rem">
                <input type="url" id="pf-add-url-input" placeholder="Or add photo from URL (https://...)" style="flex:1;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-xs);padding:0.5rem 0.8rem;font-size:0.82rem;color:var(--text)">
                <button type="button" class="btn btn-secondary" id="btn-add-photo-url" style="padding:0.5rem 0.9rem;font-size:0.8rem">Add URL</button>
            </div>

            <div class="form-section-label" style="margin-top:1rem">Likes &amp; Status</div>
            <div class="form-row">
                <div class="form-group">
                    <label for="pf-likes">Likes Count (❤️)</label>
                    <input type="number" id="pf-likes" min="0" value="${profile?.likes ?? 120}">
                </div>
                <div class="form-group">
                    <label for="pf-available">Availability</label>
                    <select id="pf-available">
                        <option value="1" ${profile?.available !== false ? 'selected' : ''}>✅ Available</option>
                        <option value="0" ${profile?.available === false ? 'selected' : ''}>⛔ Unavailable</option>
                    </select>
                </div>
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top:0.5rem">${isEdit ? '💾 Save Changes to SQLite' : '✨ Save New Profile to SQLite'}</button>
        </form>`;
}

function setupProfileFormHandlers() {
    const fileInput = $('#pf-file-input');
    const uploadZone = $('#pf-upload-zone');
    const addUrlBtn = $('#btn-add-photo-url');
    const addUrlInput = $('#pf-add-url-input');

    fileInput?.addEventListener('change', e => {
        handlePhotoUpload(e.target.files);
        fileInput.value = '';
    });

    if (uploadZone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadZone.addEventListener(eventName, e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
        });
        ['dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); });
        });
        uploadZone.addEventListener('drop', e => {
            if (e.dataTransfer?.files?.length) {
                handlePhotoUpload(e.dataTransfer.files);
            }
        });
    }

    addUrlBtn?.addEventListener('click', () => {
        const url = (addUrlInput?.value || '').trim();
        if (url) {
            currentFormPhotos.push(url);
            if (addUrlInput) addUrlInput.value = '';
            renderFormPhotos();
            showToast('Photo URL added to gallery', 'success');
        }
    });

    $('#pf-photo-grid')?.addEventListener('click', e => {
        const delBtn = e.target.closest('[data-action="delete-form-photo"]');
        if (delBtn) {
            const idx = Number(delBtn.dataset.index);
            currentFormPhotos.splice(idx, 1);
            renderFormPhotos();
            return;
        }

        const coverBtn = e.target.closest('[data-action="make-cover-photo"]');
        if (coverBtn) {
            const idx = Number(coverBtn.dataset.index);
            const [selected] = currentFormPhotos.splice(idx, 1);
            currentFormPhotos.unshift(selected);
            renderFormPhotos();
            showToast('Set as main cover photo! ★', 'info');
        }
    });
}

function closeProfileFormModal() { closeOverlay('profile-form-modal'); }

async function saveProfile(event) {
    event.preventDefault();
    const form = event.target;
    const editId = form.dataset.editId ? Number(form.dataset.editId) : null;

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Writing to SQLite database…';

    const interests = ($('#pf-interests').value || '').split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
    const name = $('#pf-name').value.trim();
    const isAvail = $('#pf-available').value === '1';

    const photos = currentFormPhotos.length ? currentFormPhotos : [
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff2d78&color=fff&size=400`
    ];

    const profileData = {
        name, age: parseInt($('#pf-age').value, 10),
        location: $('#pf-location').value.trim(),
        bio: $('#pf-bio').value.trim(),
        interests,
        photos,
        likes: parseInt($('#pf-likes').value, 10) || 0,
        available: isAvail
    };

    try {
        if (editId) {
            const existing = profiles.find(p => p.id === editId);
            await DB.profiles.save({ ...existing, ...profileData, id: editId });
            showToast('Profile & photos saved to SQLite! ✅', 'success');
        } else {
            await DB.profiles.save(profileData);
            showToast('New profile created in SQLite database! ✨', 'success');
        }
        profiles = await DB.profiles.all();
        closeProfileFormModal();
        renderAdminProfiles();
        renderProfiles();
        renderDatabaseStats();
        updateQuickStats();
    } catch (e) {
        console.error('Save profile error:', e);
        showToast('Failed to save profile to database', 'error');
    } finally {
        submitBtn.disabled = false;
    }
}

async function deleteProfile(id) {
    if (!confirm('Are you sure you want to delete this profile from SQLite? This cannot be undone.')) return;
    try {
        await DB.profiles.delete(id);
        profiles = await DB.profiles.all();
        renderAdminProfiles();
        renderProfiles();
        renderDatabaseStats();
        updateQuickStats();
        showToast('Profile deleted from SQLite database', 'info');
    } catch (e) {
        showToast('Failed to delete profile', 'error');
    }
}

// ===== Propose Alternative =====
function openProposeModal(requestId) {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    const alternatives = profiles.filter(p => p.id !== request.profileId && p.available);
    if (alternatives.length === 0) { showToast('No alternative profiles available', 'error'); return; }

    const content = $('#booking-content');
    content.innerHTML = `
        <div class="booking-body">
            <h2 class="booking-title">Propose Alternative</h2>
            <p style="color:var(--text-muted);margin-bottom:1.25rem;text-align:center;font-size:0.9rem">
                Instead of <strong style="color:var(--text)">${escapeHtml(request.profileName)}</strong>, suggest another companion for <strong style="color:var(--text)">${escapeHtml(request.clientName)}</strong>:
            </p>
            <div class="alt-list">
                ${alternatives.map(p => `
                    <div class="alt-option" data-action="select-alt" data-request="${requestId}" data-profile="${p.id}" role="button" tabindex="0">
                        <img src="${escapeHtml(mainPhoto(p))}" alt="${escapeHtml(p.name)}" loading="lazy" width="50" height="50">
                        <div>
                            <div style="font-weight:700;margin-bottom:0.1rem">${escapeHtml(p.name)}</div>
                            <div style="font-size:0.78rem;color:var(--text-muted)">${p.age} yrs · ❤️ ${p.likes || 0} likes</div>
                        </div>
                        <div style="margin-left:auto;color:var(--rose);font-size:1.2rem" aria-hidden="true">→</div>
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-secondary" type="button" style="margin-top:1rem;width:100%" data-action="close-booking">Cancel</button>
        </div>`;

    content.querySelectorAll('img').forEach(img => img.addEventListener('error', () => imgFallback(img), { once: true }));
    openOverlay('booking-modal');
}

async function selectAlternative(requestId, newProfileId) {
    const request = requests.find(r => r.id === requestId);
    const newProfile = profiles.find(p => p.id === newProfileId);
    if (!request || !newProfile) return;

    request.profileId = newProfile.id;
    request.profileName = newProfile.name;
    request.profileImage = mainPhoto(newProfile);
    request.status = 'pending';
    request.message = (request.message || '') + ` [Admin suggested: ${newProfile.name}]`;

    try {
        await DB.requests.save(request);
        requests = await DB.requests.all();
        renderAdminRequests();
        updateRequestBadge();
        closeBookingModal();
        renderDatabaseStats();
        showToast(`Alternative proposed: ${newProfile.name}`, 'success');
    } catch (e) {
        showToast('Failed to propose alternative', 'error');
    }
}

// ===== Toast System =====
let toastContainer = null;

function showToast(message, type = 'success', duration = 3200) {
    if (!toastContainer) toastContainer = $('#toast-container');
    if (!toastContainer) return;

    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || '✓'}</span><span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    raf(() => { raf(() => toast.classList.add('show')); });

    setTimeout(() => {
        toast.classList.add('hiding');
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// ===== Event Delegation =====
function handleClick(e) {
    const target = e.target.closest('[data-action], [data-page], [data-tab], [data-close], [data-filter], .admin-tab, .logo, .modal-overlay, #btn-lightbox-close');
    if (!target) return;

    // Backdrop click
    if (target.classList.contains('modal-overlay') && e.target === target) {
        if (target.id === 'profile-modal') closeModal();
        else if (target.id === 'booking-modal') closeBookingModal();
        else if (target.id === 'profile-form-modal') closeProfileFormModal();
        else if (target.id === 'lightbox-modal') closeLightbox();
        return;
    }

    if (target.id === 'btn-lightbox-close') {
        closeLightbox();
        return;
    }

    if (target.classList.contains('logo') || target.id === 'logo-home') {
        e.preventDefault();
        showPage('client');
        return;
    }

    // Booking filter pills
    if (target.classList.contains('req-filter-pill')) {
        $$('.req-filter-pill').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');
        currentBookingFilter = target.dataset.filter || 'all';
        renderAdminRequests();
        return;
    }

    const page = target.dataset.page;
    if (page) {
        showPage(page);
        return;
    }

    const tab = target.dataset.tab;
    if (tab) {
        switchAdminTab(tab);
        return;
    }

    const close = target.dataset.close;
    if (close === 'profile') { closeModal(); return; }
    if (close === 'booking') { closeBookingModal(); return; }
    if (close === 'form') { closeProfileFormModal(); return; }

    const action = target.dataset.action;
    if (!action) return;

    const id = target.dataset.id ? Number(target.dataset.id) : null;

    switch (action) {
        case 'open-profile': openProfileModal(id); break;
        case 'book': e.stopPropagation(); openBookingModal(id); break;
        case 'book-from-modal': closeModal(); openBookingModal(id); break;
        case 'close-profile': closeModal(); break;
        case 'close-booking': closeBookingModal(); break;
        case 'gallery-prev': navigateGallery(-1); break;
        case 'gallery-next': navigateGallery(1); break;
        case 'gallery-thumb': setGalleryIndex(Number(target.dataset.index)); break;
        case 'open-lightbox': {
            const src = $('#gallery-main-img')?.src || (currentGalleryPhotos[currentGalleryIndex]);
            const profile = profiles.find(p => p.id === selectedProfileId) || profiles[0];
            openLightbox(src, profile?.name || 'Companion photo');
            break;
        }
        case 'like-profile':
            e.stopPropagation();
            handleLikeProfile(id, target);
            break;
        case 'like-profile-modal':
            handleLikeProfileModal(id, target.closest('.btn-like-large'));
            break;
        case 'edit-profile': openEditProfileModal(id); break;
        case 'delete-profile': deleteProfile(id); break;
        case 'set-booking-status': updateRequestStatus(id, target.dataset.status); break;
        case 'delete-booking': deleteBookingRequest(id); break;
        case 'propose': openProposeModal(id); break;
        case 'select-alt': selectAlternative(Number(target.dataset.request), Number(target.dataset.profile)); break;
    }
}

function handleKeydown(e) {
    if (e.key === 'Escape') {
        if ($('#lightbox-modal')?.classList.contains('active')) closeLightbox();
        else if ($('#profile-modal')?.classList.contains('active')) closeModal();
        else if ($('#booking-modal')?.classList.contains('active')) closeBookingModal();
        else if ($('#profile-form-modal')?.classList.contains('active')) closeProfileFormModal();
        return;
    }

    // Shortcut to toggle Admin panel: Ctrl+Shift+A or Cmd+Shift+A
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if ($('#admin-view')?.classList.contains('active')) {
            showPage('client');
        } else {
            showPage('admin');
        }
        return;
    }

    const card = e.target.closest('.profile-card');
    if (card && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        openProfileModal(Number(card.dataset.id));
    }
}

function handleSubmit(e) {
    if (e.target.id === 'booking-form') submitBooking(e);
    else if (e.target.id === 'profile-form') saveProfile(e);
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
    initAurora();

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('submit', handleSubmit);

    // Route listener
    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);

    // Age, Interest, and Search filter listeners
    $('#filter-age')?.addEventListener('change', renderProfiles);
    $('#filter-interest')?.addEventListener('change', renderProfiles);
    $('#filter-search')?.addEventListener('input', debouncedRenderProfiles);
    $('#search-clear')?.addEventListener('click', () => {
        const inp = $('#filter-search');
        if (inp) { inp.value = ''; renderProfiles(); }
    });
    $('#btn-add-profile')?.addEventListener('click', openAddProfileModal);

    // SQLite DB Tab Actions
    $('#btn-download-sqlite')?.addEventListener('click', handleDownloadSQLite);
    $('#btn-export-json')?.addEventListener('click', handleExportJSON);
    $('#btn-run-query')?.addEventListener('click', handleRunSQL);
    $('#sql-query-input')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); handleRunSQL(); }
    });

    // Logo triple click shortcut for quick admin access
    let logoClicks = 0;
    $('#logo-home')?.addEventListener('click', () => {
        logoClicks++;
        if (logoClicks >= 3) {
            logoClicks = 0;
            showPage('admin');
            showToast('Admin mode activated via secret trigger!', 'info');
        }
        setTimeout(() => { logoClicks = 0; }, 1000);
    });

    // Fix admin panels initial state
    $$('#admin-view .admin-panel').forEach(p => { if (!p.classList.contains('active')) p.hidden = true; });

    initPWA();

    // Initialise SQLite Database
    try {
        const data = await DB.init(DEFAULT_PROFILES, DEFAULT_CLIENTS, DEFAULT_REQUESTS);
        profiles = data.profiles;
        clients = data.clients;
        requests = data.requests;
        const key = await getUserKey();
        userLikedIds = new Set(DB.profiles.getUserLikes(key));
    } catch (err) {
        console.error('DB init failed:', err);
        showToast('Database fallback active', 'error');
        profiles = DEFAULT_PROFILES;
        clients = DEFAULT_CLIENTS;
        requests = DEFAULT_REQUESTS;
    }

    // Render initial page based on URL route
    checkRoute();
    updateRequestBadge();
    updateQuickStats();

    // Hide loading overlay
    hideLoading();
});
