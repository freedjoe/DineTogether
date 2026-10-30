// =====================================================
//  DineTogether v3.2 — app.js
//  Real SQLite WASM · Photo Optimization · /_/admin
//  Deep Rose · Pink · Sultry Dark Theme
//  Enhanced Filters by Age · Complete Photos & Lightbox
//  Booking with Phone Numbers · Full Booking Manager
//  Production-polished: hero stats, results count,
//  focus management, phone validation, keyboard nav
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

// Location Localization Map (EN / FR / AR)
const LOCATION_I18N = {
    ar: {
        'Paris, France': 'باريس، فرنسا',
        'Milan, Italy': 'ميلانو، إيطاليا',
        'Tokyo, Japan': 'طوكيو، اليابان',
        'Barcelona, Spain': 'برشلونة، إسبانيا',
        'London, UK': 'لندن، المملكة المتحدة',
        'New York, USA': 'نيويورك، الولايات المتحدة'
    },
    fr: {
        'Paris, France': 'Paris, France',
        'Milan, Italy': 'Milan, Italie',
        'Tokyo, Japan': 'Tokyo, Japon',
        'Barcelona, Spain': 'Barcelone, Espagne',
        'London, UK': 'Londres, Royaume-Uni',
        'New York, USA': 'New York, États-Unis'
    }
};

function formatLocation(loc) {
    if (!loc) return '';
    const lang = (typeof currentLang !== 'undefined' && currentLang) ? currentLang : 'en';
    return LOCATION_I18N[lang]?.[loc] || loc;
}

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

// ===== Phone Number Validation =====
function isValidPhone(phone) {
    // Accept international format: +, digits, spaces, dashes, dots, parens
    // Minimum 6 digits after stripping non-numeric chars
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 6 && digits.length <= 15 && /^[+\d\s\-().]+$/.test(phone);
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


// ===== Complete Multi-Language & RTL Localization (EN, FR, AR) =====
const I18N = {
    en: {
        code: 'EN',
        dir: 'ltr',
        name: 'English',
        skipLink: 'Skip to companions',
        heroTitle: 'Find Your Perfect <span class="highlight">Dining Companion</span>',
        heroSub: 'Connect with fascinating people over exquisite food. Make lasting friendships, meaningful connections, or simply savour great company.',
        filterAgeLabel: 'Age',
        allAges: 'All Ages',
        age18_24: '18 – 24 years',
        age25_29: '25 – 29 years',
        age30_34: '30 – 34 years',
        age35Plus: '35+ years',
        filterInterestLabel: 'Interest',
        allInterests: 'All Interests',
        intArt: '🎨 Art & Culture',
        intMusic: '🎵 Music',
        intTravel: '✈️ Travel',
        intFitness: '💪 Fitness',
        intTech: '💻 Technology',
        intFood: '🍷 Food & Wine',
        filterSearchLabel: 'Search',
        searchPlaceholder: 'Search by name, bio, or location…',
        clearSearch: 'Clear search',
        discoverHeading: 'Discover Companions',
        available: 'Available',
        unavailable: 'Unavailable',
        yearsOld: 'years old',
        yearsOldShort: 'years',
        bookNow: 'Book Now',
        likeProfile: (name) => `Like ${name}`,
        undoLikeProfile: (name) => `Undo like for ${name}`,
        fullPhoto: '⛶ Full Photo',
        close: 'Close',
        ageLocation: 'Age & Location',
        availability: 'Availability',
        showLoveTitle: (name) => `Show Love for ${name}`,
        youLikedTitle: (name) => `You Liked ${name}`,
        showLoveSub: (name) => `Tap the heart if you'd love to dine with ${name}`,
        undoLikeSub: 'Tap again if you want to undo your like',
        like: 'Like',
        liked: 'Liked',
        bookDinner: '🍽️ Book for Dinner',
        bookModalTitle: (name) => `Book ${name}`,
        yourName: 'Your Full Name',
        phoneNumber: 'Your Phone / WhatsApp',
        phoneHint: 'Include country code (e.g. +1, +44, +33)',
        preferredDate: 'Date',
        preferredTime: 'Time',
        venue: 'Restaurant / Venue',
        venuePlaceholder: 'Where would you like to dine?',
        notes: 'Personal Message',
        notesPlaceholder: 'Add a note, special dietary requests, or table details…',
        optional: 'optional',
        submitBooking: '🍽️ Send Dining Request',
        cancel: 'Cancel',
        bookingSuccess: 'Booking request submitted successfully! We will confirm shortly.',
        bookingPhoneInvalid: 'Please enter a valid phone number (at least 7 digits)',
        bookingNameInvalid: 'Please enter your full name (at least 2 characters)',
        bookingDateInvalid: 'Please select a valid future date',
        footerCopy: '© {year} DineTogether. All rights reserved.',
        installTitle: 'Install DineTogether',
        installSub: 'Add to your home screen',
        installBtn: 'Install',
        noCompanionsTitle: 'No companions found',
        noCompanionsDesc: 'Try adjusting your age or interest filters, or',
        clearAllFilters: 'clear all filters',
        companionsCount: (filtered, total) => filtered === total ? `${total} companion${total !== 1 ? 's' : ''}` : `${filtered} of ${total} companions`,
        langToast: 'Language: English',
        themeToastLight: 'Theme: ☀️ Light',
        themeToastDark: 'Theme: 🌙 Dark',
        themeBtnDark: 'Dark',
        themeBtnLight: 'Light',
        themeAriaDark: 'Switch to Dark mode',
        themeAriaLight: 'Switch to Light mode',
        themeTitleDark: 'Switch to 🌙 Dark mode',
        themeTitleLight: 'Switch to ☀️ Light mode',
        likesLabel: 'likes',
        namePlaceholder: 'e.g. Alexander Vance',
        phonePlaceholder: 'e.g. +1 234 567 8900',
        returnBtn: 'Return',
        returnToCompanions: 'Return to Companions',
        adminBrandTitle: 'DineTogether Admin',
        adminStatProfiles: 'Profiles',
        adminStatPending: 'Pending',
        adminStatClients: 'Clients',
        adminBackToSite: 'Back to Site',
        adminProfilesTab: 'Profiles',
        adminBookingsTab: 'Bookings',
        adminClientsTab: 'Clients',
        adminDatabaseTab: 'SQLite DB',
        adminManageProfiles: 'Manage Profiles',
        adminAddProfile: 'Add Profile',
        adminNoProfilesTitle: 'No profiles in SQLite yet',
        adminNoProfilesSub: 'Add your first companion profile',
        adminEditPhotos: 'Edit & Photos',
        adminDelete: 'Delete',
        adminManageBookings: 'Manage Bookings',
        adminFilterAll: 'All Bookings',
        adminFilterPending: '⏳ Pending',
        adminFilterAccepted: '✅ Accepted',
        adminFilterCancelled: '❌ Cancelled',
        adminNoBookingsTitle: (f) => f === 'all' ? 'No bookings' : `No ${f} bookings`,
        adminNoBookingsSub: 'New reservations and booking requests will appear here',
        adminPhoneNotProvided: 'Phone not provided',
        adminAt: 'at',
        adminAccept: 'Accept',
        adminDecline: 'Decline',
        adminProposeAlt: 'Propose Alternative',
        adminCancelBooking: 'Cancel Booking',
        adminMoveToPending: 'Move to Pending',
        adminReaccept: 'Re-accept',
        adminStatusPending: 'Pending',
        adminStatusAccepted: 'Accepted',
        adminStatusCancelled: 'Cancelled',
        adminRegisteredClients: 'Registered Clients',
        adminNoClientsTitle: 'No clients yet',
        adminNoClientsSub: 'Registered clients will appear here after a booking is made',
        adminDinnersCount: (n) => `${n} dinner${n !== 1 ? 's' : ''}`,
        adminPendingCount: (n) => `${n} pending`,
        adminSqliteDbManager: 'SQLite Database Manager',
        adminExportSqlite: 'Export .sqlite File',
        adminExportJson: 'Export JSON',
        adminEngineStatus: 'Engine & Persistence Status',
        adminStorageVal: 'IndexedDB Binary Store (DineTogetherV3)',
        adminTableProfiles: 'profiles (Companions):',
        adminTableClients: 'clients (Registered):',
        adminTableRequests: 'requests (Bookings):',
        adminTablePhotos: 'photos (IDB Gallery):',
        adminSqlPlaceholder: 'Enter SQL query (e.g. SELECT * FROM profiles)...',
        adminEngine: 'Engine:',
        adminStorage: 'Storage:',
        adminSyncMode: 'Sync Mode:',
        adminRealtimeFlush: 'Real-time flush on every write',
        adminLiveTables: 'Live SQLite Tables & Rows',
        adminRowsUnit: 'rows',
        adminFilesUnit: 'files',
        adminExecuteSql: 'Execute SQL Query (Direct to SQLite)',
        adminRunSql: 'Run SQL',
        adminSqlSuccess: 'Statement executed successfully & database persisted!',
        adminSqlError: 'SQL syntax error',
        adminEditProfileTitle: '✏️ Edit Profile',
        adminAddProfileTitle: '✨ Add New Companion',
        adminBasicInfo: 'Basic Information',
        adminFullName: 'Full Name',
        adminAge: 'Age',
        adminLocation: 'Location / City',
        adminBio: 'Bio',
        adminBioPlaceholder: 'Write a charming, engaging bio...',
        adminPreferences: 'Preferences',
        adminInterests: 'Interests',
        adminInterestsHelp: 'comma separated',
        adminPhotoStudio: 'Photo Gallery & Optimization Studio',
        adminPhotoStudioDesc: 'Uploaded photos are auto-optimized to 800×1000 portrait ratio with JPEG compression for peak quality and speed.',
        adminPhotoDropText: 'Click or drag photos here to upload',
        adminPhotoDropSub: 'Auto-downscales & compresses image file size for crisp portrait display',
        adminPhotoUrlPlaceholder: 'Or add photo from URL (https://...)',
        adminAddUrlBtn: 'Add URL',
        adminLikesStatus: 'Likes & Status',
        adminLikesCount: 'Likes Count ❤️',
        adminAvailability: 'Availability',
        adminSaveProfileEdit: '💾 Save Changes to SQLite',
        adminSaveProfileAdd: '✨ Save New Profile to SQLite',
        adminCoverBadge: 'Cover',
        adminMakeMain: '★ Main',
        adminNoPhotosYet: 'No photos uploaded yet. Drop image files or paste an image URL below.',
        adminProposeTitle: 'Propose Alternative',
        adminProposeBody: (orig, client) => `Instead of <strong style="color:var(--text)">${orig}</strong>, suggest another companion for <strong style="color:var(--text)">${client}</strong>:`,
        adminSuggestCompanion: (name) => `Suggest ${name}`,
        adminConfirmDeleteProfile: 'Delete this companion? This cannot be undone.',
        adminConfirmDeleteBooking: 'Delete this booking request? This cannot be undone.',
        adminConfirmDeleteClient: 'Delete this client from SQLite? Any linked booking history will remain.'
    },
    fr: {
        code: 'FR',
        dir: 'ltr',
        name: 'Français',
        skipLink: 'Passer aux compagnons',
        heroTitle: 'Trouvez Votre <span class="highlight">Compagnon Idéal</span>',
        heroSub: 'Rencontrez des personnes passionnantes autour d\'une table d\'exception. Tissez des liens sincères ou savourez simplement une excellente compagnie.',
        filterAgeLabel: 'Âge',
        allAges: 'Tous les âges',
        age18_24: '18 – 24 ans',
        age25_29: '25 – 29 ans',
        age30_34: '30 – 34 ans',
        age35Plus: '35+ ans',
        filterInterestLabel: 'Centres d\'intérêt',
        allInterests: 'Tous les intérêts',
        intArt: '🎨 Art & Culture',
        intMusic: '🎵 Musique',
        intTravel: '✈️ Voyage',
        intFitness: '💪 Sport & Forme',
        intTech: '💻 Technologie',
        intFood: '🍷 Gastronomie & Vins',
        filterSearchLabel: 'Recherche',
        searchPlaceholder: 'Rechercher par nom, bio, ville…',
        clearSearch: 'Effacer la recherche',
        discoverHeading: 'Découvrir les compagnons',
        available: 'Disponible',
        unavailable: 'Indisponible',
        yearsOld: 'ans',
        yearsOldShort: 'ans',
        bookNow: 'Réserver',
        likeProfile: (name) => `Aimer ${name}`,
        undoLikeProfile: (name) => `Ne plus aimer ${name}`,
        fullPhoto: '⛶ Photo complète',
        close: 'Fermer',
        ageLocation: 'Âge & Ville',
        availability: 'Disponibilité',
        showLoveTitle: (name) => `Montrez votre coup de cœur pour ${name}`,
        youLikedTitle: (name) => `Vous avez aimé ${name}`,
        showLoveSub: (name) => `Appuyez sur le cœur si vous souhaitez dîner avec ${name}`,
        undoLikeSub: 'Appuyez à nouveau pour annuler votre coup de cœur',
        like: 'J\'aime',
        liked: 'Aimé',
        bookDinner: '🍽️ Réserver un dîner',
        bookModalTitle: (name) => `Réserver avec ${name}`,
        yourName: 'Votre nom complet',
        phoneNumber: 'Téléphone / WhatsApp',
        phoneHint: 'Inclure l\'indicatif pays (ex. +33, +1, +44)',
        preferredDate: 'Date',
        preferredTime: 'Heure',
        venue: 'Restaurant / Lieu',
        venuePlaceholder: 'Où souhaitez-vous dîner ?',
        notes: 'Message personnel',
        notesPlaceholder: 'Demandes particulières, régimes ou détails de table…',
        optional: 'facultatif',
        submitBooking: '🍽️ Envoyer la demande',
        cancel: 'Annuler',
        bookingSuccess: 'Demande de réservation envoyée avec succès ! Confirmation rapide.',
        bookingPhoneInvalid: 'Veuillez saisir un numéro de téléphone valide (au moins 7 chiffres)',
        bookingNameInvalid: 'Veuillez renseigner votre nom complet (au moins 2 caractères)',
        bookingDateInvalid: 'Veuillez sélectionner une date future valide',
        footerCopy: '© {year} DineTogether. Tous droits réservés.',
        installTitle: 'Installer DineTogether',
        installSub: 'Ajouter à l\'écran d\'accueil',
        installBtn: 'Installer',
        noCompanionsTitle: 'Aucun compagnon trouvé',
        noCompanionsDesc: 'Modifiez vos filtres d\'âge ou d\'intérêt, ou',
        clearAllFilters: 'réinitialiser les filtres',
        companionsCount: (filtered, total) => filtered === total ? `${total} compagnon${total !== 1 ? 's' : ''}` : `${filtered} sur ${total} compagnons`,
        langToast: 'Langue : Français',
        themeToastLight: 'Thème : ☀️ Clair',
        themeToastDark: 'Thème : 🌙 Sombre',
        themeBtnDark: 'Sombre',
        themeBtnLight: 'Clair',
        themeAriaDark: 'Passer au mode sombre',
        themeAriaLight: 'Passer au mode clair',
        themeTitleDark: 'Passer au mode 🌙 Sombre',
        themeTitleLight: 'Passer au mode ☀️ Clair',
        likesLabel: 'j\'aime',
        namePlaceholder: 'ex. Alexandre Vance',
        phonePlaceholder: 'ex. +33 6 12 34 56 78',
        returnBtn: 'Retour',
        returnToCompanions: 'Retour aux compagnons',
        adminBrandTitle: 'DineTogether Administration',
        adminStatProfiles: 'Profils',
        adminStatPending: 'En attente',
        adminStatClients: 'Clients',
        adminBackToSite: 'Retour au site',
        adminProfilesTab: 'Profils',
        adminBookingsTab: 'Réservations',
        adminClientsTab: 'Clients',
        adminDatabaseTab: 'Base SQLite',
        adminManageProfiles: 'Gérer les Profils',
        adminAddProfile: 'Ajouter un profil',
        adminNoProfilesTitle: 'Aucun profil dans SQLite pour le moment',
        adminNoProfilesSub: 'Ajoutez votre premier profil de compagnon',
        adminEditPhotos: 'Modifier & Photos',
        adminDelete: 'Supprimer',
        adminManageBookings: 'Gérer les Réservations',
        adminFilterAll: 'Toutes les réservations',
        adminFilterPending: '⏳ En attente',
        adminFilterAccepted: '✅ Confirmées',
        adminFilterCancelled: '❌ Annulées',
        adminNoBookingsTitle: (f) => f === 'all' ? 'Aucune réservation' : `Aucune réservation (${f})`,
        adminNoBookingsSub: 'Les nouvelles réservations et demandes apparaîtront ici',
        adminPhoneNotProvided: 'Téléphone non fourni',
        adminAt: 'à',
        adminAccept: 'Accepter',
        adminDecline: 'Refuser',
        adminProposeAlt: 'Proposer une alternative',
        adminCancelBooking: 'Annuler la réservation',
        adminMoveToPending: 'Marquer en attente',
        adminReaccept: 'Réaccepter',
        adminStatusPending: 'En attente',
        adminStatusAccepted: 'Confirmée',
        adminStatusCancelled: 'Annulée',
        adminRegisteredClients: 'Clients Enregistrés',
        adminNoClientsTitle: 'Aucun client pour le moment',
        adminNoClientsSub: 'Les clients enregistrés apparaîtront ici après une réservation',
        adminDinnersCount: (n) => `${n} dîner${n > 1 ? 's' : ''}`,
        adminPendingCount: (n) => `${n} en attente`,
        adminSqliteDbManager: 'Gestionnaire SQLite',
        adminExportSqlite: 'Exporter le fichier .sqlite',
        adminExportJson: 'Exporter en JSON',
        adminEngineStatus: 'Moteur & État de Persistance',
        adminStorageVal: 'Stockage Binaire IndexedDB (DineTogetherV3)',
        adminTableProfiles: 'profiles (Compagnons) :',
        adminTableClients: 'clients (Enregistrés) :',
        adminTableRequests: 'requests (Réservations) :',
        adminTablePhotos: 'photos (Galerie IDB) :',
        adminSqlPlaceholder: 'Entrez une requête SQL (ex. SELECT * FROM profiles)...',
        adminEngine: 'Moteur :',
        adminStorage: 'Stockage :',
        adminSyncMode: 'Mode de synchronisation :',
        adminRealtimeFlush: 'Écriture instantanée à chaque modification',
        adminLiveTables: 'Tables & Lignes SQLite en Direct',
        adminRowsUnit: 'lignes',
        adminFilesUnit: 'fichiers',
        adminExecuteSql: 'Exécuter une Requête SQL (Direct SQLite)',
        adminRunSql: 'Exécuter SQL',
        adminSqlSuccess: 'Requête exécutée avec succès & base sauvegardée !',
        adminSqlError: 'Erreur de syntaxe SQL',
        adminEditProfileTitle: '✏️ Modifier le profil',
        adminAddProfileTitle: '✨ Ajouter un compagnon',
        adminBasicInfo: 'Informations générales',
        adminFullName: 'Nom complet',
        adminAge: 'Âge',
        adminLocation: 'Ville / Emplacement',
        adminBio: 'Biographie',
        adminBioPlaceholder: 'Rédigez une biographie captivante et charmante...',
        adminPreferences: 'Préférences',
        adminInterests: 'Centres d\'intérêt',
        adminInterestsHelp: 'séparés par une virgule',
        adminPhotoStudio: 'Galerie Photos & Optimisation',
        adminPhotoStudioDesc: 'Les photos téléchargées sont automatiquement optimisées au ratio portrait 800×1000 avec compression JPEG pour une qualité optimale.',
        adminPhotoDropText: 'Cliquez ou déposez des photos ici pour les ajouter',
        adminPhotoDropSub: 'Redimensionnement & compression automatiques pour un affichage net',
        adminPhotoUrlPlaceholder: 'Ou ajouter une photo via URL (https://...)',
        adminAddUrlBtn: 'Ajouter l\'URL',
        adminLikesStatus: 'Coups de cœur & Disponibilité',
        adminLikesCount: 'Nombre de J\'aime ❤️',
        adminAvailability: 'Disponibilité',
        adminSaveProfileEdit: '💾 Enregistrer les modifications',
        adminSaveProfileAdd: '✨ Enregistrer le nouveau profil',
        adminCoverBadge: 'Principale',
        adminMakeMain: '★ Définir principale',
        adminNoPhotosYet: 'Aucune photo pour le moment. Glissez des images ou collez une URL ci-dessous.',
        adminProposeTitle: 'Proposer une alternative',
        adminProposeBody: (orig, client) => `Au lieu de <strong style="color:var(--text)">${orig}</strong>, suggérer un autre compagnon pour <strong style="color:var(--text)">${client}</strong> :`,
        adminSuggestCompanion: (name) => `Suggérer ${name}`,
        adminConfirmDeleteProfile: 'Supprimer ce compagnon ? Cette action est irréversible.',
        adminConfirmDeleteBooking: 'Supprimer cette demande de réservation ? Action irréversible.',
        adminConfirmDeleteClient: 'Supprimer ce client de SQLite ? L\'historique des réservations sera conservé.'
    },
    ar: {
        code: 'العربية',
        dir: 'rtl',
        name: 'العربية',
        skipLink: 'الانتقال إلى المرافقين',
        heroTitle: 'اعثر على <span class="highlight">شريك العشاء المثالي</span>',
        heroSub: 'تواصل مع شخصيات راقية ومميزة حول مأدبة طعام استثنائية. اصنع ذكريات لا تُنسى واستمتع بأروع اللحظات.',
        filterAgeLabel: 'العمر',
        allAges: 'جميع الأعمار',
        age18_24: '18 – 24 سنة',
        age25_29: '25 – 29 سنة',
        age30_34: '30 – 34 سنة',
        age35Plus: '35+ سنة',
        filterInterestLabel: 'الاهتمام',
        allInterests: 'جميع الاهتمامات',
        intArt: '🎨 فن وثقافة',
        intMusic: '🎵 موسيقى',
        intTravel: '✈️ سفر وسياحة',
        intFitness: '💪 رياضة ولياقة',
        intTech: '💻 تكنولوجيا',
        intFood: '🍷 طعام وتذوق',
        filterSearchLabel: 'بحث',
        searchPlaceholder: 'ابحث بالاسم، النبذة، أو المدينة…',
        clearSearch: 'مسح البحث',
        discoverHeading: 'استكشف المرافقين',
        available: 'متاح',
        unavailable: 'غير متاح',
        yearsOld: 'سنة',
        yearsOldShort: 'سنة',
        bookNow: 'احجز الآن',
        likeProfile: (name) => `إعجاب بـ ${name}`,
        undoLikeProfile: (name) => `إلغاء الإعجاب بـ ${name}`,
        fullPhoto: '⛶ الصورة الكاملة',
        close: 'إغلاق',
        ageLocation: 'العمر والموقع',
        availability: 'الحالة',
        showLoveTitle: (name) => `أظهر إعجابك بـ ${name}`,
        youLikedTitle: (name) => `أنت معجب بـ ${name}`,
        showLoveSub: (name) => `اضغط على القلب إذا كنت ترغب في تناول العشاء برفقة ${name}`,
        undoLikeSub: 'اضغط مرة أخرى لإلغاء الإعجاب',
        like: 'إعجاب',
        liked: 'تم الإعجاب',
        bookDinner: '🍽️ حجز عشاء',
        bookModalTitle: (name) => `حجز موعد مع ${name}`,
        yourName: 'الاسم الكامل',
        phoneNumber: 'رقم الهاتف / واتساب',
        phoneHint: 'يرجى تضمين رمز الدولة (مثل +966، +971، +212)',
        preferredDate: 'التاريخ',
        preferredTime: 'الوقت',
        venue: 'المطعم / المكان',
        venuePlaceholder: 'أين ترغب في تناول العشاء؟',
        notes: 'رسالة خاصة',
        notesPlaceholder: 'أي متطلبات غذائية خاصة أو تفاصيل إضافية…',
        optional: 'اختياري',
        submitBooking: '🍽️ إرسال طلب العشاء',
        cancel: 'إلغاء',
        bookingSuccess: 'تم إرسال طلب الحجز بنجاح! سنتواصل معك قريباً لتأكيد الموعد.',
        bookingPhoneInvalid: 'يرجى إدخال رقم هاتف صحيح (7 أرقام على الأقل)',
        bookingNameInvalid: 'يرجى إدخال اسمك الكامل (حرفان على الأقل)',
        bookingDateInvalid: 'يرجى اختيار تاريخ صالح في المستقبل',
        footerCopy: '© {year} DineTogether. جميع الحقوق محفوظة.',
        installTitle: 'تثبيت DineTogether',
        installSub: 'أضف إلى الشاشة الرئيسية',
        installBtn: 'تثبيت',
        noCompanionsTitle: 'لم يتم العثور على مرافقين',
        noCompanionsDesc: 'جرّب تعديل خيارات التصفية أو',
        clearAllFilters: 'إعادة ضبط الفلاتر',
        companionsCount: (filtered, total) => filtered === total ? `${total} مرافق متاح` : `${filtered} من أصل ${total} مرافقين`,
        langToast: 'اللغة: العربية',
        themeToastLight: 'المظهر: ☀️ فاتح',
        themeToastDark: 'المظهر: 🌙 داكن',
        themeBtnDark: 'داكن',
        themeBtnLight: 'فاتح',
        themeAriaDark: 'التبديل إلى المظهر الداكن',
        themeAriaLight: 'التبديل إلى المظهر الفاتح',
        themeTitleDark: 'التبديل إلى المظهر 🌙 الداكن',
        themeTitleLight: 'التبديل إلى المظهر ☀️ الفاتح',
        likesLabel: 'إعجاب',
        namePlaceholder: 'مثال: أحمد المنصوري',
        phonePlaceholder: 'مثال: 501234567 966+',
        returnBtn: 'عودة',
        returnToCompanions: 'العودة إلى المرافقين',
        adminBrandTitle: 'لوحة تحكم DineTogether',
        adminStatProfiles: 'المرافقين',
        adminStatPending: 'قيد الانتظار',
        adminStatClients: 'العملاء',
        adminBackToSite: 'العودة إلى الموقع',
        adminProfilesTab: 'المرافقين',
        adminBookingsTab: 'الحجوزات',
        adminClientsTab: 'العملاء',
        adminDatabaseTab: 'قاعدة SQLite',
        adminManageProfiles: 'إدارة المرافقين',
        adminAddProfile: 'إضافة مرافق',
        adminNoProfilesTitle: 'لا توجد ملفات تعريف في SQLite بعد',
        adminNoProfilesSub: 'أضف أول ملف تعريف لمرافق جديد',
        adminEditPhotos: 'تعديل والصور',
        adminDelete: 'حذف',
        adminManageBookings: 'إدارة الحجوزات',
        adminFilterAll: 'جميع الحجوزات',
        adminFilterPending: '⏳ قيد الانتظار',
        adminFilterAccepted: '✅ المقبولة',
        adminFilterCancelled: '❌ الملغاة',
        adminNoBookingsTitle: (f) => f === 'all' ? 'لا توجد حجوزات' : `لا توجد حجوزات (${f})`,
        adminNoBookingsSub: 'ستظهر طلبات الحجز والمواعيد الجديدة هنا فور استلامها',
        adminPhoneNotProvided: 'لم يتم تقديم رقم هاتف',
        adminAt: 'في تمام',
        adminAccept: 'قبول',
        adminDecline: 'رفض',
        adminProposeAlt: 'اقتراح بديل',
        adminCancelBooking: 'إلغاء الحجز',
        adminMoveToPending: 'نقل إلى قيد الانتظار',
        adminReaccept: 'إعادة القبول',
        adminStatusPending: 'قيد الانتظار',
        adminStatusAccepted: 'مؤكد',
        adminStatusCancelled: 'ملغي',
        adminRegisteredClients: 'العملاء المسجلون',
        adminNoClientsTitle: 'لا يوجد عملاء بعد',
        adminNoClientsSub: 'سيظهر العملاء المسجلون هنا فور إتمام أول حجز عشاء',
        adminDinnersCount: (n) => `${n} عشاء`,
        adminPendingCount: (n) => `${n} قيد الانتظار`,
        adminSqliteDbManager: 'مدير قاعدة بيانات SQLite',
        adminExportSqlite: 'تصدير ملف .sqlite',
        adminExportJson: 'تصدير JSON',
        adminEngineStatus: 'حالة المحرك والتخزين الدائم',
        adminStorageVal: 'تخزين ثنائي IndexedDB (DineTogetherV3)',
        adminTableProfiles: 'المرافقين (profiles):',
        adminTableClients: 'العملاء (clients):',
        adminTableRequests: 'الحجوزات (requests):',
        adminTablePhotos: 'معرض الصور (photos IDB):',
        adminSqlPlaceholder: 'أدخل استعلام SQL (مثال: SELECT * FROM profiles)...',
        adminEngine: 'المحرك:',
        adminStorage: 'التخزين:',
        adminSyncMode: 'نمط المزامنة:',
        adminRealtimeFlush: 'حفظ فوري في الوقت الفعلي مع كل عملية كتابة',
        adminLiveTables: 'جداول وسجلات SQLite المباشرة',
        adminRowsUnit: 'صفوف',
        adminFilesUnit: 'ملفات',
        adminExecuteSql: 'تنفيذ استعلام SQL (مباشر إلى SQLite)',
        adminRunSql: 'تشغيل SQL',
        adminSqlSuccess: 'تم تنفيذ الاستعلام بنجاح وحفظه في قاعدة البيانات!',
        adminSqlError: 'خطأ في صياغة استعلام SQL',
        adminEditProfileTitle: '✏️ تعديل الملف التعريفي',
        adminAddProfileTitle: '✨ إضافة مرافق جديد',
        adminBasicInfo: 'المعلومات الأساسية',
        adminFullName: 'الاسم الكامل',
        adminAge: 'العمر',
        adminLocation: 'المدينة / الموقع',
        adminBio: 'النبذة التعريفية',
        adminBioPlaceholder: 'اكتب نبذة جذابة وراقية...',
        adminPreferences: 'التفضيلات',
        adminInterests: 'الاهتمامات والهوايات',
        adminInterestsHelp: 'مفصولة بفواصل',
        adminPhotoStudio: 'معرض الصور واستوديو التحسين',
        adminPhotoStudioDesc: 'يتم تحسين الصور المرفوعة تلقائياً بنسبة 800×1000 وضغط JPEG لأعلى جودة وسرعة تصفح.',
        adminPhotoDropText: 'انقر أو اسحب الصور هنا للرفع',
        adminPhotoDropSub: 'تصغير وضغط ذكي لحجم الصور لعرض بورتريه نقي وفائق الدقة',
        adminPhotoUrlPlaceholder: 'أو أضف رابط صورة مباشر (https://...)',
        adminAddUrlBtn: 'إضافة الرابط',
        adminLikesStatus: 'الإعجابات والحالة',
        adminLikesCount: 'عدد الإعجابات ❤️',
        adminAvailability: 'حالة التوفر',
        adminSaveProfileEdit: '💾 حفظ التعديلات في SQLite',
        adminSaveProfileAdd: '✨ حفظ المرافق الجديد في SQLite',
        adminCoverBadge: 'الرئيسية',
        adminMakeMain: '★ تعيين كرئيسية',
        adminNoPhotosYet: 'لم يتم رفع صور بعد. اسحب ملفات الصور أو الصق رابطاً أدناه.',
        adminProposeTitle: 'اقتراح بديل',
        adminProposeBody: (orig, client) => `بدلاً من <strong style="color:var(--text)">${orig}</strong>، اقترح مرافقاً آخر لـ <strong style="color:var(--text)">${client}</strong>:`,
        adminSuggestCompanion: (name) => `اقتراح ${name}`,
        adminConfirmDeleteProfile: 'هل أنت متأكد من حذف هذا المرافق؟ لا يمكن التراجع عن هذا الإجراء.',
        adminConfirmDeleteBooking: 'هل أنت متأكد من حذف طلب الحجز؟ لا يمكن التراجع عن هذا الإجراء.',
        adminConfirmDeleteClient: 'هل أنت متأكد من حذف هذا العميل من SQLite؟ سيبقى سجل الحجوزات المرتبط به.'
    }
};

let currentLang = 'en';

function t(key, ...args) {
    const langObj = I18N[currentLang] || I18N.en;
    const val = langObj[key] !== undefined ? langObj[key] : (I18N.en[key] !== undefined ? I18N.en[key] : key);
    if (typeof val === 'function') {
        return val(...args);
    }
    return val;
}

function initLanguage() {
    let saved = null;
    try {
        saved = localStorage.getItem('dinetogether-lang');
    } catch (_) {}
    const lang = saved && I18N[saved] ? saved : 'en';
    setLanguage(lang, false);
}


// Universal Translation Applicator
function applyTranslations(root = document) {
    const lang = currentLang || 'en';
    const t = I18N[lang] || I18N.en;

    root.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key && t[key]) {
            el.textContent = t[key];
        }
    });
    root.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (key && t[key]) {
            el.innerHTML = t[key];
        }
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key && t[key]) {
            el.setAttribute('placeholder', t[key]);
        }
    });
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (key && t[key]) {
            el.setAttribute('title', t[key]);
        }
    });
    root.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        if (key && t[key]) {
            el.setAttribute('aria-label', t[key]);
        }
    });
}

function setLanguage(lang, notify = true) {
    if (!I18N[lang]) lang = 'en';
    currentLang = lang;
    try {
        localStorage.setItem('dinetogether-lang', lang);
    } catch (_) {}

    const isRtl = I18N[lang].dir === 'rtl';
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);

    // Update Language Toggle Button
    const codeEl = document.getElementById('lang-code');
    if (codeEl) codeEl.textContent = I18N[lang].code;
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.setAttribute('aria-label', `Language: ${I18N[lang].name}. Click to switch.`);
        langBtn.setAttribute('title', `Language: ${I18N[lang].name} (Click to switch)`);
    }

    // Apply translations across all DOM elements
    applyTranslations(document);

    // Update dynamic footer text
    const yearEl = document.getElementById('footer-year');
    const yr = yearEl ? yearEl.textContent : new Date().getFullYear();
    const copyEl = document.getElementById('footer-copy');
    if (copyEl) {
        copyEl.innerHTML = I18N[lang].footerCopy.replace('{year}', `<span id="footer-year">${yr}</span>`);
    }

    // Update Theme Toggle Button to match active language
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(currentTheme, false);

    // Re-render profiles to reflect localized strings
    renderProfiles();

    // Re-render admin sections if loaded
    renderAdminProfiles();
    renderAdminRequests();
    renderAdminClients();
    renderDatabaseStats();
    updateQuickStats();

    // If Add/Edit profile modal is open, re-render form in active language
    const pfModal = document.getElementById('profile-form-modal');
    if (pfModal && !pfModal.hidden && pfModal.classList.contains('active')) {
        const form = document.getElementById('profile-form');
        const editId = form?.dataset.editId ? Number(form.dataset.editId) : null;
        const currentProfile = editId ? profiles.find(p => p.id === editId) : null;
        const content = document.getElementById('profile-form-content');
        if (content) {
            content.innerHTML = profileFormHTML(currentProfile);
            setupProfileFormHandlers();
            renderFormPhotos();
        }
    }

    if (notify) {
        showToast(I18N[lang].langToast, 'info', 2000);
    }
}

function cycleLanguage() {
    const order = ['en', 'fr', 'ar'];
    const idx = order.indexOf(currentLang);
    const next = order[(idx + 1) % order.length];
    setLanguage(next, true);
}

// ===== Theme Management (Velvet Noir / Champagne Pearl) =====
function initTheme() {
    let savedTheme = null;
    try {
        savedTheme = localStorage.getItem('dinetogether-theme');
    } catch (_) {}

    // Default to Light Mode as requested
    const currentTheme = savedTheme || 'light';
    applyTheme(currentTheme, false);

    try {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
            if (!localStorage.getItem('dinetogether-theme')) {
                applyTheme(e.matches ? 'light' : 'dark', false);
            }
        });
    } catch (_) {}
}

function applyTheme(theme, notify = true) {
    document.documentElement.setAttribute('data-theme', theme);
    const toggleBtn = document.getElementById('theme-toggle');
    const isLight = theme === 'light';

    if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
        toggleBtn.setAttribute('title', isLight ? t('themeTitleDark') : t('themeTitleLight'));
        toggleBtn.setAttribute('aria-label', isLight ? t('themeAriaDark') : t('themeAriaLight'));
        const label = document.getElementById('theme-label');
        if (label) label.textContent = isLight ? t('themeBtnDark') : t('themeBtnLight');
        const iconDark = toggleBtn.querySelector('.theme-icon-dark');
        const iconLight = toggleBtn.querySelector('.theme-icon-light');
        if (iconDark && iconLight) {
            iconDark.hidden = !isLight;
            iconDark.style.display = isLight ? 'inline-flex' : 'none';
            iconLight.hidden = isLight;
            iconLight.style.display = isLight ? 'none' : 'inline-flex';
        }
    }

    if (notify) {
        showToast(isLight ? t('themeToastLight') : t('themeToastDark'), 'info', 2000);
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    try {
        localStorage.setItem('dinetogether-theme', next);
    } catch (_) {}
    applyTheme(next, true);
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

// ===== Focus Management =====
let _lastFocusedBeforeModal = null;

function trapFocus(el) {
    const focusable = el.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first) return;
    first.focus();
    el.addEventListener('keydown', function handler(e) {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
            if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });
}

// ===== Modal & Lightbox Helpers =====
function openOverlay(id) {
    const el = document.getElementById(id);
    if (!el) return;
    _lastFocusedBeforeModal = document.activeElement;
    el.classList.add('active');
    el.hidden = false;
    document.body.style.overflow = 'hidden';
    // Focus trap after render
    requestAnimationFrame(() => {
        const modal = el.querySelector('.modal, .lightbox-content');
        if (modal) trapFocus(modal);
    });
}

function closeOverlay(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('active');
    el.hidden = true;
    if (!$$('.modal-overlay.active').length) document.body.style.overflow = '';
    // Restore focus
    if (_lastFocusedBeforeModal && typeof _lastFocusedBeforeModal.focus === 'function') {
        _lastFocusedBeforeModal.focus();
        _lastFocusedBeforeModal = null;
    }
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
        applyTranslations(view);
        renderProfiles();
        updateHeroStats();
    } else {
        const view = $('#admin-view');
        view.classList.add('active'); view.hidden = false;
        if (updateHash && !window.location.hash.includes('admin')) {
            window.location.hash = '#/_/admin';
        }
        applyTranslations(view);
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

// ===== Hero Stats =====
function updateHeroStats() {
    const companionEl = $('#stat-companions');
    const cityEl = $('#stat-cities');
    const bookingsEl = $('#stat-bookings');
    if (companionEl) companionEl.textContent = profiles.length;
    if (cityEl) {
        const uniqueCities = new Set(profiles.map(p => p.location?.split(',')[0]?.trim()).filter(Boolean));
        cityEl.textContent = uniqueCities.size;
    }
    if (bookingsEl) bookingsEl.textContent = requests.length;
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

    // Update results count
    const countEl = $('#results-count');
    if (countEl) {
        countEl.textContent = t('companionsCount', filtered.length, profiles.length);
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <span class="empty-state-icon">🔍</span>
                <h3>${t('noCompanionsTitle')}</h3>
                <p>${t('noCompanionsDesc')} <button type="button" class="link-btn" id="clear-filters-btn">${t('clearAllFilters')}</button></p>
            </div>`;
        $('#clear-filters-btn')?.addEventListener('click', () => {
            const ageEl = $('#filter-age');
            const intEl = $('#filter-interest');
            const srchEl = $('#filter-search');
            if (ageEl) ageEl.value = '';
            if (intEl) intEl.value = '';
            if (srchEl) srchEl.value = '';
            renderProfiles();
        });
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
                    ${p.available ? `<span class="availability-badge">${t('available')}</span>` : ''}
                    ${photoCount > 1 ? `<span class="photo-count" aria-label="${photoCount} photos">📷 ${photoCount}</span>` : ''}
                </div>
                <div class="profile-card-body">
                    <div class="profile-card-name">${name}</div>
                    <div class="profile-card-age">
                        <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        ${p.age} ${t('yearsOld')} · ${location}
                    </div>
                    <div class="profile-card-bio">${bio}</div>
                    <div class="profile-card-tags">${tags}</div>
                    <div class="profile-card-footer">
                        <button class="profile-card-likes ${userLikedIds.has(p.id) ? 'liked' : ''}" type="button" data-action="like-profile" data-id="${p.id}" title="${userLikedIds.has(p.id) ? t('undoLikeProfile', name) : t('likeProfile', name)}" aria-pressed="${userLikedIds.has(p.id)}">
                            <span class="heart-icon" aria-hidden="true">${userLikedIds.has(p.id) ? '❤️' : '🤍'}</span>
                            <span class="likes-count" id="card-likes-${p.id}">${p.likes || 0}</span>
                        </button>
                        <button class="profile-card-book" type="button" data-action="book" data-id="${p.id}">${t('bookNow')}</button>
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
        <div class="profile-fullscreen-view">
            <!-- Fullscreen Sticky Top Bar with Return Button -->
            <header class="profile-top-bar">
                <button class="btn-profile-return" type="button" data-action="close-profile" aria-label="${t('returnBtn')}" title="${t('returnBtn')}">
                    <svg class="return-arrow-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                    <span class="return-label">${t('returnBtn')}</span>
                </button>
                <div class="profile-top-meta">
                    <span class="profile-top-name">${name}</span>
                    <span class="profile-top-badge">${profile.available ? '★ ' + t('available') : '⛔ ' + t('unavailable')}</span>
                </div>
                <button class="modal-close profile-top-close" type="button" data-close="profile" data-action="close-profile" aria-label="${t('close')}" title="${t('close')}">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </header>

            <!-- Scrollable Content Body -->
            <div class="profile-fullscreen-scroll">
                <div class="profile-fullscreen-inner">
                    <div class="photo-gallery">
                        <div class="gallery-blur-bg" id="gallery-blur-bg" style="background-image:url('${escapeHtml(curPhoto)}')"></div>
                        <img src="${escapeHtml(curPhoto)}" alt="${name}" class="gallery-main" id="gallery-main-img" width="700" height="460" data-action="open-lightbox" title="Click to view full photo">
                        <div class="gallery-overlay" aria-hidden="true"></div>
                        <button class="btn-full-photo" type="button" data-action="open-lightbox" title="View full photo">${t('fullPhoto')}</button>
                        ${multi ? `
                            <button class="gallery-nav gallery-prev" type="button" data-action="gallery-prev" aria-label="Previous photo">&#10094;</button>
                            <button class="gallery-nav gallery-next" type="button" data-action="gallery-next" aria-label="Next photo">&#10095;</button>
                            <span class="gallery-counter" id="gallery-counter" aria-live="polite" aria-atomic="true">1 / ${currentGalleryPhotos.length}</span>
                        ` : ''}
                    </div>
                    ${multi ? `
                        <div class="gallery-thumbnails" id="gallery-thumbnails" role="list" aria-label="Photo thumbnails">
                            ${currentGalleryPhotos.map((photo, i) => `
                                <img src="${escapeHtml(photo)}" alt="Photo ${i + 1} of ${name}" class="${i === 0 ? 'active' : ''}"
                                     data-action="gallery-thumb" data-index="${i}" loading="lazy" decoding="async" width="62" height="62"
                                     role="listitem" tabindex="${i === 0 ? '0' : '-1'}">
                            `).join('')}
                        </div>
                    ` : ''}
                    <div class="modal-profile-body">
                        <h2 class="modal-profile-name" id="modal-profile-title">${name}</h2>
                        <div class="modal-profile-meta">
                            <span>🎂 ${profile.age} ${t('yearsOld')}</span>
                            <span class="meta-sep">·</span>
                            <span>📍 ${escapeHtml(profile.location)}</span>
                            <span class="meta-sep">·</span>
                            <span class="modal-meta-likes"><span class="heart-pulse" aria-hidden="true">${isLiked ? '❤️' : '🤍'}</span> <strong id="modal-likes-count">${profile.likes || 0}</strong> ${t('likesLabel')}</span>
                        </div>
                        <p class="modal-profile-bio">${escapeHtml(profile.bio)}</p>
                        <div class="modal-profile-details">
                            <div class="detail-item">
                                <div class="detail-label">${t('ageLocation')}</div>
                                <div class="detail-value">${profile.age} ${t('yearsOldShort')} · ${escapeHtml(profile.location)}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">${t('availability')}</div>
                                <div class="detail-value" style="color:${profile.available ? 'var(--success)' : 'var(--danger)'}">
                                    ${profile.available ? '✅ ' + t('available') : '⛔ ' + t('unavailable')}
                                </div>
                            </div>
                        </div>
                        <div class="modal-profile-tags">
                            ${(profile.interests || []).map(i => `<span class="tag">${escapeHtml(i)}</span>`).join('')}
                        </div>

                        <div class="like-section">
                            <div class="like-section-content">
                                <div class="like-section-title">${isLiked ? t('youLikedTitle', name) : t('showLoveTitle', name)}</div>
                                <p class="like-section-sub" id="modal-like-sub">${isLiked ? t('undoLikeSub') : t('showLoveSub', name)}</p>
                            </div>
                            <button class="btn-like-large ${isLiked ? 'liked' : ''}" type="button" data-action="like-profile-modal" data-id="${profile.id}" title="${isLiked ? 'Click to undo like' : 'Click to like'}" aria-pressed="${isLiked}">
                                <span class="heart-bounce" aria-hidden="true">${isLiked ? '❤️' : '🤍'}</span>
                                <span class="like-btn-label">${isLiked ? t('liked') : t('like')}</span>
                                <span class="like-pill-count" id="modal-btn-likes">${profile.likes || 0}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Floating/Sticky Action Bar (Always Accessible) -->
            <footer class="modal-profile-actions profile-fullscreen-actions">
                <div class="profile-actions-inner">
                    <button class="btn btn-primary" type="button" data-action="book-from-modal" data-id="${profile.id}">${t('bookDinner')}</button>
                    <button class="btn btn-secondary" type="button" data-action="close-profile">${t('close')}</button>
                </div>
            </footer>
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
    $$('#gallery-thumbnails img').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === currentGalleryIndex);
        thumb.setAttribute('tabindex', i === currentGalleryIndex ? '0' : '-1');
    });
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
        if (label) label.textContent = liked ? t('liked') : t('like');
        if (liked) {
            btn.classList.add('pop');
            setTimeout(() => btn.classList.remove('pop'), 450);
        }
    }

    const title = $('.like-section-title');
    if (title) title.textContent = liked ? t('youLikedTitle', name) : t('showLoveTitle', name);
    const sub = $('#modal-like-sub');
    if (sub) sub.textContent = liked ? t('undoLikeSub') : t('showLoveSub', name);
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
                <span style="background:var(--grad-rose);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">${t('bookModalTitle', escapeHtml(profile.name))}</span>
            </h2>
            <form class="booking-form" id="booking-form" novalidate>
                <div class="form-group">
                    <label for="booking-name">${t('yourName')} <span aria-hidden="true">*</span></label>
                    <input type="text" id="booking-name" required placeholder="${escapeHtml(t('namePlaceholder'))}" autocomplete="name" minlength="2">
                </div>
                <div class="form-group">
                    <label for="booking-phone">${t('phoneNumber')} <span aria-hidden="true">*</span></label>
                    <input type="tel" id="booking-phone" required placeholder="${escapeHtml(t('phonePlaceholder'))}" autocomplete="tel">
                    <span class="field-hint">${t('phoneHint')}</span>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="booking-date">${t('preferredDate')} <span aria-hidden="true">*</span></label>
                        <input type="date" id="booking-date" required min="${todayISO()}">
                    </div>
                    <div class="form-group">
                        <label for="booking-time">${t('preferredTime')} <span aria-hidden="true">*</span></label>
                        <input type="time" id="booking-time" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="booking-restaurant">${t('venue')} <span aria-hidden="true">*</span></label>
                    <input type="text" id="booking-restaurant" required placeholder="${t('venuePlaceholder')}">
                </div>
                <div class="form-group">
                    <label for="booking-message">${t('notes')} <span class="optional-badge">${t('optional')}</span></label>
                    <textarea id="booking-message" placeholder="${t('notesPlaceholder')}"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">${t('submitBooking')}</button>
            </form>
        </div>`;

    openOverlay('booking-modal');
}

function closeBookingModal() { closeOverlay('booking-modal'); }

async function submitBooking(event) {
    event.preventDefault();

    const nameEl = $('#booking-name');
    const phoneEl = $('#booking-phone');
    const dateEl = $('#booking-date');
    const timeEl = $('#booking-time');
    const restaurantEl = $('#booking-restaurant');
    const messageEl = $('#booking-message');

    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const date = dateEl.value;
    const time = timeEl.value;
    const restaurant = restaurantEl.value.trim();
    const message = messageEl.value.trim();

    // Validation
    if (!name || name.length < 2) {
        showToast(t('bookingNameInvalid'), 'error');
        nameEl.focus();
        return;
    }
    if (!phone || !isValidPhone(phone)) {
        showToast('Please enter a valid phone number including country code', 'error');
        phoneEl.focus();
        return;
    }
    if (!date) {
        showToast('Please select a date', 'error');
        dateEl.focus();
        return;
    }
    if (!time) {
        showToast('Please select a time', 'error');
        timeEl.focus();
        return;
    }
    if (!restaurant || restaurant.length < 2) {
        showToast('Please enter a restaurant or venue name', 'error');
        restaurantEl.focus();
        return;
    }

    const submitBtn = event.target.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving booking…';

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
        showToast('Dining request sent successfully! 🍽️', 'success');
        updateRequestBadge();
        updateQuickStats();
        updateHeroStats();
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
    const t = I18N[currentLang] || I18N.en;
    if (profiles.length === 0) {
        list.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="empty-state-icon">👤</span><h3>${t.adminNoProfilesTitle}</h3><p>${t.adminNoProfilesSub}</p></div>`;
        return;
    }
    list.innerHTML = profiles.map(p => `
        <div class="admin-profile-card">
            <img src="${escapeHtml(mainPhoto(p))}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async" width="72" height="72">
            <div class="admin-profile-info">
                <div class="admin-profile-name">${escapeHtml(p.name)}</div>
                <div class="admin-profile-meta">${p.age} ${t.yearsOldShort} · ❤️ ${p.likes || 0} ${t.likesLabel} · 📷 ${p.photos?.length || 1}<br>${escapeHtml(formatLocation(p.location))}</div>
                <div class="admin-profile-status">
                    <span class="avail-badge ${p.available ? 'avail-on' : 'avail-off'}">${p.available ? '● ' + t.available : '○ ' + t.unavailable}</span>
                </div>
                <div class="admin-profile-actions">
                    <button class="btn-edit" type="button" data-action="edit-profile" data-id="${p.id}">✏️ ${t.adminEditPhotos}</button>
                    <button class="btn-delete" type="button" data-action="delete-profile" data-id="${p.id}">🗑️ ${t.adminDelete}</button>
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
                <h3>${(I18N[currentLang] || I18N.en).adminNoBookingsTitle(currentBookingFilter)}</h3>
                <p>${(I18N[currentLang] || I18N.en).adminNoBookingsSub}</p>
            </div>`;
        return;
    }

    list.innerHTML = filtered.map(r => {
        const t = I18N[currentLang] || I18N.en;
        const phone = r.clientPhone || r.phone || t.adminPhoneNotProvided;
        const statusClass = r.status === 'accepted' ? 'accepted' : (r.status === 'declined' || r.status === 'cancelled' ? 'declined' : 'pending');
        const statusLabel = r.status === 'accepted' ? '✅ ' + t.adminStatusAccepted : (r.status === 'declined' || r.status === 'cancelled' ? '❌ ' + t.adminStatusCancelled : '⏳ ' + t.adminStatusPending);

        return `
            <div class="request-card">
                <img src="${escapeHtml(r.profileImage)}" alt="${escapeHtml(r.profileName)}" loading="lazy" decoding="async" width="88" height="88">
                <div class="request-info">
                    <div class="request-header">
                        <div class="request-client">
                            ${escapeHtml(r.clientName)}
                            <span class="request-arrow" aria-hidden="true">→</span>
                            ${escapeHtml(r.profileName)}
                        </div>
                        <span class="request-status status-${statusClass}" role="status">${statusLabel}</span>
                    </div>

                    <div>
                        <span class="request-phone">📞 ${escapeHtml(phone)}</span>
                    </div>

                    <div class="request-details">
                        <span>📅 ${escapeHtml(r.date)} ${t.adminAt} ${escapeHtml(r.time)}</span>
                        <span>📍 ${escapeHtml(r.restaurant)}</span>
                    </div>

                    ${r.message ? `<div class="request-message">"${escapeHtml(r.message)}"</div>` : ''}

                    <div class="request-actions">
                        ${r.status === 'pending' ? `
                            <button class="btn-success" type="button" data-action="set-booking-status" data-id="${r.id}" data-status="accepted">✅ ${t.adminAccept}</button>
                            <button class="btn-danger" type="button" data-action="set-booking-status" data-id="${r.id}" data-status="declined">❌ ${t.adminDecline}</button>
                            <button class="btn-warning" type="button" data-action="propose" data-id="${r.id}">🔄 ${t.adminProposeAlt}</button>
                        ` : ''}
                        ${r.status === 'accepted' ? `
                            <button class="btn-danger" type="button" data-action="set-booking-status" data-id="${r.id}" data-status="declined">❌ ${t.adminCancelBooking}</button>
                            <button class="btn-pending" type="button" data-action="set-booking-status" data-id="${r.id}" data-status="pending">⏳ ${t.adminMoveToPending}</button>
                        ` : ''}
                        ${(r.status === 'declined' || r.status === 'cancelled') ? `
                            <button class="btn-success" type="button" data-action="set-booking-status" data-id="${r.id}" data-status="accepted">✅ ${t.adminReaccept}</button>
                            <button class="btn-pending" type="button" data-action="set-booking-status" data-id="${r.id}" data-status="pending">⏳ ${t.adminMoveToPending}</button>
                        ` : ''}
                        <button class="btn-delete" type="button" data-action="delete-booking" data-id="${r.id}" title="Delete booking">🗑️ ${t.adminDelete}</button>
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
        updateHeroStats();
        const msg = status === 'accepted' ? 'Booking Accepted! ✅' : (status === 'declined' ? 'Booking Declined ❌' : 'Booking moved to Pending ⏳');
        showToast(msg, status === 'accepted' ? 'success' : (status === 'declined' ? 'error' : 'info'));
    } catch (e) {
        showToast('Failed to update booking status', 'error');
    }
}

async function deleteBookingRequest(requestId) {
    const t = I18N[currentLang] || I18N.en; if (!confirm(t.adminConfirmDeleteBooking)) return;
    try {
        await DB.requests.delete(requestId);
        requests = await DB.requests.all();
        renderAdminRequests();
        updateRequestBadge();
        updateQuickStats();
        renderDatabaseStats();
        updateHeroStats();
        showToast('Booking deleted', 'info');
    } catch (e) {
        showToast('Failed to delete booking', 'error');
    }
}

function renderAdminClients() {
    const list = $('#admin-clients-list');
    if (!list) return;
    const t = I18N[currentLang] || I18N.en;
    if (clients.length === 0) {
        list.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="empty-state-icon">👥</span><h3>${(I18N[currentLang] || I18N.en).adminNoClientsTitle}</h3><p>${(I18N[currentLang] || I18N.en).adminNoClientsSub}</p></div>`;
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
                    <span class="client-stat-item">✅ ${t.adminDinnersCount(accepted)}</span>
                    ${pending ? `<span class="client-stat-item">⏳ ${t.adminPendingCount(pending)}</span>` : ''}
                </div>
                <div class="client-actions" style="margin-top:0.85rem;display:flex;justify-content:center;">
                    <button class="btn-delete" type="button" data-action="delete-client" data-id="${c.id}" title="Delete Client" aria-label="Delete ${escapeHtml(c.name)}">🗑️ ${t.adminDelete}</button>
                </div>
            </div>`;
    }).join('');
    list.querySelectorAll('img').forEach(img => img.addEventListener('error', () => imgFallback(img), { once: true }));
}

async function deleteClient(clientId) {
    const t = I18N[currentLang] || I18N.en; if (!confirm(t.adminConfirmDeleteClient)) return;
    try {
        await DB.clients.delete(clientId);
        clients = await DB.clients.all();
        renderAdminClients();
        updateQuickStats();
        renderDatabaseStats();
        showToast('Client deleted from SQLite', 'info');
    } catch (e) {
        showToast('Failed to delete client', 'error');
    }
}

function updateRequestBadge() {
    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const badge = $('#request-badge');
    if (!badge) return;
    badge.textContent = pendingCount;
    badge.hidden = pendingCount === 0;
}

function updateQuickStats() {
    const t = I18N[currentLang] || I18N.en;
    const qs = {
        'qs-profiles': profiles.length,
        'qs-pending': requests.filter(r => r.status === 'pending').length,
        'qs-clients': clients.length
    };
    Object.entries(qs).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });

    const lblProfiles = document.querySelector('#admin-quick-stats .quick-stat:nth-child(1) .quick-stat-lbl');
    const lblPending = document.querySelector('#admin-quick-stats .quick-stat:nth-child(2) .quick-stat-lbl');
    const lblClients = document.querySelector('#admin-quick-stats .quick-stat:nth-child(3) .quick-stat-lbl');
    if (lblProfiles) lblProfiles.textContent = t.adminStatProfiles;
    if (lblPending) lblPending.textContent = t.adminStatPending;
    if (lblClients) lblClients.textContent = t.adminStatClients;
}

// ===== SQLite Database Manager Tab =====
function renderDatabaseStats() {
    try {
        if (!DB || typeof DB.getTableStats !== 'function') return;
        const stats = DB.getTableStats();
        const t = I18N[currentLang] || I18N.en;
        const pEl = $('#db-stat-profiles');
        const cEl = $('#db-stat-clients');
        const rEl = $('#db-stat-requests');
        const phEl = $('#db-stat-photos');
        if (pEl) pEl.textContent = `${stats.profiles} ${t.adminRowsUnit}`;
        if (cEl) cEl.textContent = `${stats.clients} ${t.adminRowsUnit}`;
        if (rEl) rEl.textContent = `${stats.requests} ${t.adminRowsUnit}`;

        if (DB.photos && typeof DB.photos.all === 'function') {
            DB.photos.all().then(rows => {
                if (phEl) phEl.textContent = `${rows.length} ${(I18N[currentLang] || I18N.en).adminFilesUnit}`;
            }).catch(() => {});
        }
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
        showToast('Downloaded dinetogether.sqlite! Open it in DB Browser for SQLite.', 'success', 4500);
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
            showToast(`Query returned ${rows.length} row${rows.length !== 1 ? 's' : ''}`, 'success');
        } else {
            DB.runRaw(sql);
            resultEl.innerHTML = '<span style="color:var(--success)">Statement executed successfully &amp; database persisted!</span>';
            renderDatabaseStats();
            showToast('Statement executed & saved to SQLite!', 'success');
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
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:1rem;color:var(--text-dim);font-size:0.8rem">${(I18N[currentLang] || I18N.en).adminNoPhotosYet}</div>';
        return;
    }
    grid.innerHTML = currentFormPhotos.map((url, i) => `
        <div class="photo-thumb" data-index="${i}">
            <img src="${escapeHtml(url)}" alt="Photo ${i + 1}" loading="lazy">
            <div class="photo-thumb-overlay">
                ${i > 0 ? `<button type="button" class="btn-make-cover" data-action="make-cover-photo" data-index="${i}" title="Make Cover Photo" style="background:var(--rose);color:#fff;border-radius:4px;padding:3px 6px;font-size:0.65rem;font-weight:600">${(I18N[currentLang] || I18N.en).adminMakeMain}</button>` : ''}
                <button type="button" class="photo-thumb-del" data-action="delete-form-photo" data-index="${i}" title="Delete photo" aria-label="Delete photo ${i + 1}">✕</button>
            </div>
            ${i === 0 ? `<span class="photo-thumb-main-badge">${(I18N[currentLang] || I18N.en).adminCoverBadge}</span>` : ''}
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
    const t = I18N[currentLang] || I18N.en;

    return `
        <form class="profile-form" id="profile-form" data-edit-id="${isEdit ? profile.id : ''}">
            <h2 id="profile-form-title">${isEdit ? t.adminEditProfileTitle : t.adminAddProfileTitle}</h2>

            <div class="form-section-label">${t.adminBasicInfo}</div>
            <div class="form-group">
                <label for="pf-name">${t.adminFullName} <span aria-hidden="true">*</span></label>
                <input type="text" id="pf-name" required placeholder="${t.namePlaceholder}" value="${escapeHtml(profile?.name || '')}" minlength="2">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="pf-age">${t.adminAge} <span aria-hidden="true">*</span></label>
                    <input type="number" id="pf-age" required min="18" max="99" placeholder="${t.adminAge}" value="${profile?.age ?? ''}">
                </div>
                <div class="form-group">
                    <label for="pf-location">${t.adminLocation} <span aria-hidden="true">*</span></label>
                    <input type="text" id="pf-location" required placeholder="Paris, France" value="${escapeHtml(profile?.location || '')}">
                </div>
            </div>
            <div class="form-group">
                <label for="pf-bio">${t.adminBio} <span aria-hidden="true">*</span></label>
                <textarea id="pf-bio" required placeholder="${t.adminBioPlaceholder}" minlength="20">${escapeHtml(profile?.bio || '')}</textarea>
            </div>

            <div class="form-section-label">${t.adminPreferences}</div>
            <div class="form-group">
                <label for="pf-interests">${t.adminInterests} <span class="optional-badge">${t.adminInterestsHelp}</span></label>
                <input type="text" id="pf-interests" placeholder="art, music, travel, wine, fitness" value="${escapeHtml((profile?.interests || []).join(', '))}">
            </div>

            <div class="form-section-label">${t.adminPhotoStudio}</div>
            <p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem">
                ${t.adminPhotoStudioDesc}
            </p>
            
            <div class="photo-grid" id="pf-photo-grid"></div>

            <div class="photo-upload-zone" id="pf-upload-zone" style="margin-top:0.75rem">
                <input type="file" id="pf-file-input" accept="image/*" multiple aria-label="Upload photos">
                <div class="photo-upload-icon" aria-hidden="true">📸</div>
                <div class="photo-upload-text">${t.adminPhotoDropText}</div>
                <div class="photo-upload-sub">${t.adminPhotoDropSub}</div>
            </div>

            <div class="photo-upload-progress" id="pf-upload-progress" hidden>
                <div class="spinner" aria-hidden="true"></div>
                <span id="pf-upload-status">Optimizing photo…</span>
            </div>

            <div style="display:flex;gap:0.5rem;margin-top:0.6rem;flex-wrap:wrap">
                <input type="url" id="pf-add-url-input" placeholder="${t.adminPhotoUrlPlaceholder}" style="flex:1;min-width:0;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-xs);padding:0.5rem 0.8rem;font-size:0.82rem;color:var(--text)" aria-label="Photo URL">
                <button type="button" class="btn btn-secondary" id="btn-add-photo-url" style="padding:0.5rem 0.9rem;font-size:0.8rem;flex-shrink:0">${t.adminAddUrlBtn}</button>
            </div>

            <div class="form-section-label" style="margin-top:1rem">${t.adminLikesStatus}</div>
            <div class="form-row">
                <div class="form-group">
                    <label for="pf-likes">${t.adminLikesCount}</label>
                    <input type="number" id="pf-likes" min="0" value="${profile?.likes ?? 120}">
                </div>
                <div class="form-group">
                    <label for="pf-available">${t.adminAvailability}</label>
                    <select id="pf-available">
                        <option value="1" ${profile?.available !== false ? 'selected' : ''}>✅ ${t.available}</option>
                        <option value="0" ${profile?.available === false ? 'selected' : ''}>⛔ ${t.unavailable}</option>
                    </select>
                </div>
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top:0.5rem">${isEdit ? t.adminSaveProfileEdit : t.adminSaveProfileAdd}</button>
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
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            currentFormPhotos.push(url);
            if (addUrlInput) addUrlInput.value = '';
            renderFormPhotos();
            showToast('Photo URL added to gallery', 'success');
        } else if (url) {
            showToast('Please enter a valid URL starting with https://', 'error');
        }
    });

    // Enter key on URL input
    addUrlInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); addUrlBtn?.click(); }
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

    // Validation
    const name = $('#pf-name').value.trim();
    const age = parseInt($('#pf-age').value, 10);
    const bio = $('#pf-bio').value.trim();

    if (!name || name.length < 2) {
        showToast('Name must be at least 2 characters', 'error');
        $('#pf-name').focus();
        return;
    }
    if (!age || age < 18 || age > 99) {
        showToast('Age must be between 18 and 99', 'error');
        $('#pf-age').focus();
        return;
    }
    if (!bio || bio.length < 20) {
        showToast('Bio must be at least 20 characters', 'error');
        $('#pf-bio').focus();
        return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving to SQLite…';

    const interests = ($('#pf-interests').value || '').split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
    const isAvail = $('#pf-available').value === '1';

    const photos = currentFormPhotos.length ? currentFormPhotos : [
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff2d78&color=fff&size=400`
    ];

    const profileData = {
        name, age,
        location: $('#pf-location').value.trim(),
        bio,
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
            showToast('New profile created in SQLite! ✨', 'success');
        }
        profiles = await DB.profiles.all();
        closeProfileFormModal();
        renderAdminProfiles();
        renderProfiles();
        renderDatabaseStats();
        updateQuickStats();
        updateHeroStats();
    } catch (e) {
        console.error('Save profile error:', e);
        showToast('Failed to save profile to database', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = editId ? '💾 Save Changes to SQLite' : '✨ Save New Profile to SQLite';
    }
}

async function deleteProfile(id) {
    if (!confirm('Delete this profile from SQLite? This cannot be undone.')) return;
    try {
        await DB.profiles.delete(id);
        profiles = await DB.profiles.all();
        renderAdminProfiles();
        renderProfiles();
        renderDatabaseStats();
        updateQuickStats();
        updateHeroStats();
        showToast('Profile deleted from SQLite', 'info');
    } catch (e) {
        showToast('Failed to delete profile', 'error');
    }
}

// ===== Propose Alternative =====
function openProposeModal(requestId) {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;
    const t = I18N[currentLang] || I18N.en;

    const alternatives = profiles.filter(p => p.id !== request.profileId && p.available);
    if (alternatives.length === 0) { showToast('No alternative profiles available', 'error'); return; }

    const content = $('#booking-content');
    content.innerHTML = `
        <div class="booking-body">
            <h2 class="booking-title">${t.adminProposeTitle}</h2>
            <p style="color:var(--text-muted);margin-bottom:1.25rem;text-align:center;font-size:0.9rem">
                ${t.adminProposeBody(escapeHtml(request.profileName), escapeHtml(request.clientName))}
            </p>
            <div class="alt-list" role="list">
                ${alternatives.map(p => `
                    <div class="alt-option" data-action="select-alt" data-request="${requestId}" data-profile="${p.id}"
                         role="button" tabindex="0" aria-label="${t.adminSuggestCompanion(escapeHtml(p.name))}">
                        <img src="${escapeHtml(mainPhoto(p))}" alt="${escapeHtml(p.name)}" loading="lazy" width="50" height="50">
                        <div>
                            <div style="font-weight:700;margin-bottom:0.1rem">${escapeHtml(p.name)}</div>
                            <div style="font-size:0.78rem;color:var(--text-muted)">${p.age} ${t.yearsOldShort} · ❤️ ${p.likes || 0} ${t.likesLabel}</div>
                        </div>
                        <div style="margin-inline-start:auto;color:var(--rose);font-size:1.2rem;display:inline-block" class="alt-arrow" aria-hidden="true">→</div>
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-secondary" type="button" style="margin-top:1rem;width:100%" data-action="close-booking">${t.cancel}</button>
        </div>`;

    content.querySelectorAll('img').forEach(img => img.addEventListener('error', () => imgFallback(img), { once: true }));

    // Keyboard navigation for alt-option items
    content.querySelectorAll('.alt-option').forEach(el => {
        el.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectAlternative(Number(el.dataset.request), Number(el.dataset.profile));
            }
        });
    });

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
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${icons[type] || '✓'}</span><span>${escapeHtml(message)}</span>`;
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
    const target = e.target.closest('[data-action], [data-page], [data-tab], [data-close], [data-filter], .admin-tab, .hero-brand, .modal-overlay, #btn-lightbox-close, .req-filter-pill, #theme-toggle, .theme-toggle-btn, #lang-toggle, .lang-toggle-btn');
    if (!target) return;

    // Language toggle (Fixed on Left)
    if (target.id === 'lang-toggle' || target.classList.contains('lang-toggle-btn') || target.closest('#lang-toggle')) {
        e.preventDefault();
        cycleLanguage();
        return;
    }

    // Theme toggle (Fixed on Right)
    if (target.id === 'theme-toggle' || target.classList.contains('theme-toggle-btn') || target.closest('#theme-toggle')) {
        e.preventDefault();
        toggleTheme();
        return;
    }

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

    if (target.classList.contains('hero-brand') || target.id === 'logo-home' || target.closest('#logo-home')) {
        e.preventDefault();
        // Handled separately via triple-click
        return;
    }

    // Booking filter pills
    if (target.classList.contains('req-filter-pill')) {
        $$('.req-filter-pill').forEach(btn => { btn.classList.remove('active'); btn.setAttribute('aria-selected', 'false'); });
        target.classList.add('active');
        target.setAttribute('aria-selected', 'true');
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
            openLightbox(src, profile?.name ? `${profile.name} — Photo ${currentGalleryIndex + 1}` : 'Photo');
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
        case 'delete-client': deleteClient(id); break;
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

    // Gallery thumbnail keyboard navigation
    const thumb = e.target.closest('#gallery-thumbnails img');
    if (thumb) {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            const next = thumb.nextElementSibling;
            if (next) { next.focus(); setGalleryIndex(Number(next.dataset.index)); }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prev = thumb.previousElementSibling;
            if (prev) { prev.focus(); setGalleryIndex(Number(prev.dataset.index)); }
        }
    }
}

function handleSubmit(e) {
    if (e.target.id === 'booking-form') submitBooking(e);
    else if (e.target.id === 'profile-form') saveProfile(e);
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
    initLanguage();
    initTheme();
    initAurora();

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('submit', handleSubmit);

    // Route listener
    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);

    // Filter listeners
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

    // Logo triple-click shortcut for admin access
    let logoClicks = 0;
    let logoClickTimer = null;
    $('#logo-home')?.addEventListener('click', e => {
        e.preventDefault();
        logoClicks++;
        clearTimeout(logoClickTimer);
        logoClickTimer = setTimeout(() => { logoClicks = 0; }, 800);
        if (logoClicks >= 3) {
            logoClicks = 0;
            clearTimeout(logoClickTimer);
            showPage('admin');
            showToast('Admin mode activated! 🔐', 'info');
        }
    });

    // Fix admin panels initial state
    $$('#admin-view .admin-panel').forEach(p => { if (!p.classList.contains('active')) p.hidden = true; });

    // Set footer year
    const yearEl = $('#footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

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
        showToast('Database fallback active — data may not persist', 'error');
        profiles = DEFAULT_PROFILES;
        clients = DEFAULT_CLIENTS;
        requests = DEFAULT_REQUESTS;
    }

    // Render initial page based on URL route
    checkRoute();
    updateRequestBadge();
    updateQuickStats();
    updateHeroStats();

    // Hide loading overlay
    hideLoading();
});
