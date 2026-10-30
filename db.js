/**
 * DineTogether — db.js v3
 * ─────────────────────────────────────────────────────────────────
 * Real SQLite database via sql.js (WASM).
 * The binary .db file is persisted to IndexedDB after every write.
 * Photos are stored separately in an IndexedDB object store as
 * optimised JPEG base64 strings, referenced by integer ID in
 * the profiles.photos JSON column.
 * ─────────────────────────────────────────────────────────────────
 */

const DB = (() => {
    const SQLJS_CDN      = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/';
    const IDB_NAME       = 'DineTogetherV3';
    const IDB_VER        = 1;
    const IDB_DB_STORE   = 'sqlite_db';   // stores the .db binary buffer
    const IDB_PHOTO_STORE = 'photos';     // stores optimised photo blobs

    let _SQL  = null;   // sql.js namespace (initSqlJs result)
    let _db   = null;   // sql.js Database instance
    let _idb  = null;   // raw IDBDatabase

    // ─── IndexedDB helpers ─────────────────────────────────────────

    function openIDB() {
        return new Promise((resolve, reject) => {
            if (_idb) { resolve(_idb); return; }
            const req = indexedDB.open(IDB_NAME, IDB_VER);
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(IDB_DB_STORE)) {
                    db.createObjectStore(IDB_DB_STORE);
                }
                if (!db.objectStoreNames.contains(IDB_PHOTO_STORE)) {
                    const ps = db.createObjectStore(IDB_PHOTO_STORE, { keyPath: 'id', autoIncrement: true });
                    ps.createIndex('profile_id', 'profile_id', { unique: false });
                }
            };
            req.onsuccess = e => { _idb = e.target.result; resolve(_idb); };
            req.onerror   = e => reject(e.target.error);
        });
    }

    function idbOp(storeName, mode, fn) {
        return openIDB().then(db => new Promise((resolve, reject) => {
            const tx   = db.transaction(storeName, mode);
            const store = tx.objectStore(storeName);
            const req   = fn(store);
            if (req) {
                req.onsuccess = e => resolve(e.target.result);
                req.onerror   = e => reject(e.target.error);
            } else {
                tx.oncomplete = () => resolve();
                tx.onerror    = e => reject(e.target.error);
            }
        }));
    }

    const idbGet     = (s, k)      => idbOp(s, 'readonly',  store => store.get(k));
    const idbPut     = (s, v, k)   => idbOp(s, 'readwrite', store => store.put(v, k));
    const idbDel     = (s, k)      => idbOp(s, 'readwrite', store => store.delete(k));
    const idbGetAll  = (s)         => idbOp(s, 'readonly',  store => store.getAll());
    const idbAdd     = (s, v)      => idbOp(s, 'readwrite', store => store.add(v));

    function idbGetByIndex(storeName, indexName, value) {
        return openIDB().then(db => new Promise((resolve, reject) => {
            const req = db
                .transaction(storeName, 'readonly')
                .objectStore(storeName)
                .index(indexName)
                .getAll(value);
            req.onsuccess = e => resolve(e.target.result);
            req.onerror   = e => reject(e.target.error);
        }));
    }

    // ─── SQLite helpers ────────────────────────────────────────────

    /** Persist the current in-memory SQLite DB to IndexedDB */
    async function persist() {
        const buf = _db.export();
        await idbPut(IDB_DB_STORE, buf, 'main');
    }

    /** Run a statement (no result) */
    function run(sql, params = []) {
        _db.run(sql, params);
    }

    /** Query multiple rows → array of plain objects */
    function query(sql, params = []) {
        const stmt = _db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
    }

    /** Query single row */
    function queryOne(sql, params = []) {
        return query(sql, params)[0] ?? null;
    }

    /** Get the last inserted rowid */
    function lastId() {
        return queryOne('SELECT last_insert_rowid() as id')?.id ?? null;
    }

    // ─── Row parsers ───────────────────────────────────────────────

    function parseProfile(row) {
        if (!row) return null;
        const initialLikes = Math.max(24, Math.round(((row.rating || 4.8) - 4) * 150 + (row.reviews || 15) * 4));
        return {
            ...row,
            interests: safeJSON(row.interests, []),
            photos:    safeJSON(row.photos, []),
            ratings:   safeJSON(row.ratings, []),
            available: row.available === 1 || row.available === true,
            likes:     row.likes != null ? Number(row.likes) : initialLikes,
        };
    }

    function parseClient(row) {
        if (!row) return null;
        return { ...row, joinDate: row.join_date, phone: row.phone || '' };
    }

    function parseRequest(row) {
        if (!row) return null;
        return {
            ...row,
            clientId:    row.client_id,
            clientName:  row.client_name,
            clientPhone: row.client_phone || row.phone || '',
            clientAvatar: row.client_avatar,
            profileId:   row.profile_id,
            profileName: row.profile_name,
            profileImage: row.profile_image,
            createdAt:   row.created_at,
        };
    }

    function safeJSON(val, fallback) {
        try { return val ? JSON.parse(val) : fallback; }
        catch { return fallback; }
    }

    // ─── Schema ────────────────────────────────────────────────────

    function createSchema() {
        _db.run(`CREATE TABLE IF NOT EXISTS profiles (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT    NOT NULL,
            age        INTEGER,
            bio        TEXT,
            cuisine    TEXT,
            interests  TEXT    DEFAULT '[]',
            location   TEXT,
            rating     REAL    DEFAULT 4.5,
            reviews    INTEGER DEFAULT 0,
            ratings    TEXT    DEFAULT '[]',
            available  INTEGER DEFAULT 1,
            photos     TEXT    DEFAULT '[]',
            likes      INTEGER DEFAULT 0,
            created_at TEXT    DEFAULT CURRENT_TIMESTAMP
        )`);

        _db.run(`CREATE TABLE IF NOT EXISTS clients (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            name      TEXT NOT NULL,
            email     TEXT,
            phone     TEXT,
            avatar    TEXT,
            join_date TEXT
        )`);

        _db.run(`CREATE TABLE IF NOT EXISTS requests (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id      INTEGER,
            client_name    TEXT,
            client_phone   TEXT,
            client_avatar  TEXT,
            profile_id     INTEGER,
            profile_name   TEXT,
            profile_image  TEXT,
            date           TEXT,
            time           TEXT,
            restaurant     TEXT,
            message        TEXT,
            status         TEXT DEFAULT 'pending',
            created_at     TEXT
        )`);

        _db.run(`CREATE TABLE IF NOT EXISTS profile_likes (
            profile_id INTEGER NOT NULL,
            user_key   TEXT    NOT NULL,
            created_at TEXT    DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(profile_id, user_key)
        )`);

        // Migrations for existing SQLite tables (safe: errors are caught)
        try { _db.run("ALTER TABLE profiles ADD COLUMN likes INTEGER DEFAULT 0"); } catch (e) {}
        try { _db.run("ALTER TABLE clients ADD COLUMN phone TEXT"); } catch (e) {}
        try { _db.run("ALTER TABLE requests ADD COLUMN client_phone TEXT"); } catch (e) {}
        try {
            _db.run(`CREATE TABLE IF NOT EXISTS profile_likes (
                profile_id INTEGER NOT NULL,
                user_key   TEXT    NOT NULL,
                created_at TEXT    DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY(profile_id, user_key)
            )`);
        } catch (e) {}
    }

    // ─── Seed ──────────────────────────────────────────────────────

    async function seedIfEmpty(profiles, clients, requests) {
        const cnt = queryOne('SELECT COUNT(*) as c FROM profiles')?.c ?? 0;
        if (cnt > 0) return;

        for (const p of profiles) {
            _db.run(
                `INSERT INTO profiles (name,age,bio,cuisine,interests,location,rating,reviews,ratings,available,photos,likes)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
                [p.name, p.age, p.bio, p.cuisine || '',
                 JSON.stringify(p.interests || []),
                 p.location, p.rating || 4.8, p.reviews || 0,
                 JSON.stringify(p.ratings || []),
                 p.available ? 1 : 0,
                 JSON.stringify(p.photos || []),
                 p.likes || 128]
            );
        }

        // FIX: include phone column in client seed
        for (const c of clients) {
            _db.run(
                `INSERT INTO clients (name,email,phone,avatar,join_date) VALUES (?,?,?,?,?)`,
                [c.name, c.email || '', c.phone || '', c.avatar, c.joinDate]
            );
        }

        // FIX: include client_phone column in request seed
        for (const r of requests) {
            _db.run(
                `INSERT INTO requests (client_id,client_name,client_phone,client_avatar,profile_id,
                 profile_name,profile_image,date,time,restaurant,message,status,created_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [r.clientId, r.clientName, r.clientPhone || r.phone || '', r.clientAvatar,
                 r.profileId, r.profileName, r.profileImage, r.date, r.time,
                 r.restaurant, r.message, r.status || 'pending',
                 r.createdAt || new Date().toISOString().split('T')[0]]
            );
        }

        await persist();
    }

    // ─── Public API ────────────────────────────────────────────────

    return {

        /** Initialise SQL, open/load DB, seed, return initial data */
        async init(defaultProfiles, defaultClients, defaultRequests) {
            await openIDB();

            // Load sql.js WASM
            _SQL = await initSqlJs({ locateFile: f => SQLJS_CDN + f });

            // Try to load an existing persisted DB
            const saved = await idbGet(IDB_DB_STORE, 'main');
            _db = saved ? new _SQL.Database(new Uint8Array(saved)) : new _SQL.Database();

            createSchema();
            await seedIfEmpty(defaultProfiles, defaultClients, defaultRequests);

            return {
                profiles: query('SELECT * FROM profiles ORDER BY id').map(parseProfile),
                clients:  query('SELECT * FROM clients  ORDER BY id').map(parseClient),
                requests: query('SELECT * FROM requests ORDER BY id').map(parseRequest),
            };
        },

        // ── Profiles ─────────────────────────────────────────────

        profiles: {
            all()  { return query('SELECT * FROM profiles ORDER BY id').map(parseProfile); },
            get(id) { return parseProfile(queryOne('SELECT * FROM profiles WHERE id=?', [id])); },
            count() { return queryOne('SELECT COUNT(*) as c FROM profiles')?.c ?? 0; },

            async save(p) {
                const inter   = JSON.stringify(p.interests || []);
                const photos  = JSON.stringify(p.photos    || []);
                const ratings = JSON.stringify(p.ratings   || []);
                const likes   = Number(p.likes != null ? p.likes : 120);

                if (p.id) {
                    _db.run(
                        `UPDATE profiles SET name=?,age=?,bio=?,cuisine=?,interests=?,location=?,
                         rating=?,reviews=?,ratings=?,available=?,photos=?,likes=? WHERE id=?`,
                        [p.name, p.age, p.bio, p.cuisine || '', inter, p.location,
                         p.rating || 4.8, p.reviews || 0, ratings, p.available ? 1 : 0, photos, likes, p.id]
                    );
                    await persist();
                    return { ...p, likes };
                } else {
                    _db.run(
                        `INSERT INTO profiles (name,age,bio,cuisine,interests,location,
                         rating,reviews,ratings,available,photos,likes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
                        [p.name, p.age, p.bio, p.cuisine || '', inter, p.location,
                         p.rating || 4.8, p.reviews || 0, ratings, p.available ? 1 : 0, photos, likes]
                    );
                    const id = lastId();
                    await persist();
                    return { ...p, id, likes };
                }
            },

            hasLiked(profileId, userKey) {
                if (!userKey) return false;
                return !!queryOne('SELECT 1 FROM profile_likes WHERE profile_id=? AND user_key=?', [profileId, userKey]);
            },

            getUserLikes(userKey) {
                if (!userKey) return [];
                return query('SELECT profile_id FROM profile_likes WHERE user_key=?', [userKey]).map(r => r.profile_id);
            },

            async toggleLike(profileId, userKey) {
                if (!userKey) throw new Error('userKey is required');
                const existing = queryOne('SELECT 1 FROM profile_likes WHERE profile_id=? AND user_key=?', [profileId, userKey]);
                let liked = false;
                if (existing) {
                    // Undo like: decrement by 1 and remove record
                    _db.run('DELETE FROM profile_likes WHERE profile_id=? AND user_key=?', [profileId, userKey]);
                    _db.run('UPDATE profiles SET likes = MAX(0, COALESCE(likes, 0) - 1) WHERE id=?', [profileId]);
                    liked = false;
                } else {
                    // Like once: increment by 1 and store record
                    _db.run('INSERT OR IGNORE INTO profile_likes (profile_id, user_key, created_at) VALUES (?, ?, ?)',
                        [profileId, userKey, new Date().toISOString()]);
                    _db.run('UPDATE profiles SET likes = COALESCE(likes, 0) + 1 WHERE id=?', [profileId]);
                    liked = true;
                }
                await persist();
                const currentLikes = queryOne('SELECT likes FROM profiles WHERE id=?', [profileId])?.likes ?? 0;
                return { liked, likes: currentLikes };
            },

            async like(id, userKey = null) {
                if (userKey) {
                    const res = await this.toggleLike(id, userKey);
                    return res.likes;
                }
                _db.run('UPDATE profiles SET likes = COALESCE(likes, 0) + 1 WHERE id=?', [id]);
                await persist();
                return queryOne('SELECT likes FROM profiles WHERE id=?', [id])?.likes ?? 0;
            },

            async delete(id) {
                _db.run('DELETE FROM profiles WHERE id=?', [id]);
                _db.run('DELETE FROM profile_likes WHERE profile_id=?', [id]);
                await persist();
            },
        },

        // ── Clients ──────────────────────────────────────────────

        clients: {
            all()    { return query('SELECT * FROM clients ORDER BY id').map(parseClient); },
            get(id)  { return parseClient(queryOne('SELECT * FROM clients WHERE id=?', [id])); },
            count()  { return queryOne('SELECT COUNT(*) as c FROM clients')?.c ?? 0; },
            byEmail(email) {
                return parseClient(queryOne('SELECT * FROM clients WHERE email=?', [email]));
            },
            byPhone(phone) {
                return parseClient(queryOne('SELECT * FROM clients WHERE phone=?', [phone]));
            },
            async save(c) {
                if (c.id) {
                    _db.run('UPDATE clients SET name=?,email=?,phone=?,avatar=?,join_date=? WHERE id=?',
                        [c.name, c.email || '', c.phone || '', c.avatar, c.joinDate, c.id]);
                    await persist();
                    return { ...c };
                } else {
                    _db.run('INSERT INTO clients (name,email,phone,avatar,join_date) VALUES (?,?,?,?,?)',
                        [c.name, c.email || '', c.phone || '', c.avatar, c.joinDate]);
                    const id = lastId();
                    await persist();
                    return { ...c, id };
                }
            },
            async delete(id) {
                _db.run('DELETE FROM clients WHERE id=?', [id]);
                await persist();
            },
        },

        // ── Requests ─────────────────────────────────────────────

        requests: {
            all() { return query('SELECT * FROM requests ORDER BY id DESC').map(parseRequest); },
            byStatus(s) { return query('SELECT * FROM requests WHERE status=? ORDER BY id DESC', [s]).map(parseRequest); },
            pendingCount() {
                return queryOne('SELECT COUNT(*) as c FROM requests WHERE status=?', ['pending'])?.c ?? 0;
            },
            count() {
                return queryOne('SELECT COUNT(*) as c FROM requests')?.c ?? 0;
            },
            async save(r) {
                if (r.id) {
                    _db.run(
                        `UPDATE requests SET client_id=?,client_name=?,client_phone=?,client_avatar=?,
                         profile_id=?,profile_name=?,profile_image=?,date=?,time=?,
                         restaurant=?,message=?,status=?,created_at=? WHERE id=?`,
                        [r.clientId, r.clientName, r.clientPhone || '', r.clientAvatar, r.profileId, r.profileName,
                         r.profileImage, r.date, r.time, r.restaurant, r.message,
                         r.status, r.createdAt, r.id]
                    );
                } else {
                    _db.run(
                        `INSERT INTO requests (client_id,client_name,client_phone,client_avatar,profile_id,
                         profile_name,profile_image,date,time,restaurant,message,status,created_at)
                         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                        [r.clientId, r.clientName, r.clientPhone || '', r.clientAvatar, r.profileId, r.profileName,
                         r.profileImage, r.date, r.time, r.restaurant, r.message,
                         r.status || 'pending', r.createdAt || new Date().toISOString().split('T')[0]]
                    );
                    r = { ...r, id: lastId() };
                }
                await persist();
                return r;
            },
            async delete(id) {
                _db.run('DELETE FROM requests WHERE id=?', [id]);
                await persist();
            },
        },

        // ── Photos (IndexedDB blob store) ─────────────────────────

        photos: {
            /** Get all photos for a profile */
            forProfile(profileId) {
                return idbGetByIndex(IDB_PHOTO_STORE, 'profile_id', profileId);
            },
            /** Get all photos */
            all() { return idbGetAll(IDB_PHOTO_STORE); },
            /** Get single photo */
            get(id) { return idbGet(IDB_PHOTO_STORE, id); },
            /** Store a new optimised photo blob into IndexedDB */
            add(profileId, dataUrl, meta = {}) {
                const record = {
                    profile_id: profileId,
                    data:       dataUrl,
                    filename:   meta.filename || 'photo.jpg',
                    width:      meta.width    || 0,
                    height:     meta.height   || 0,
                    size_kb:    meta.size_kb  || 0,
                    created_at: new Date().toISOString(),
                };
                return openIDB().then(db => new Promise((res, rej) => {
                    const req = db.transaction(IDB_PHOTO_STORE, 'readwrite')
                                  .objectStore(IDB_PHOTO_STORE).add(record);
                    req.onsuccess = e => res({ ...record, id: e.target.result });
                    req.onerror   = e => rej(e.target.error);
                }));
            },
            /** Delete a photo by its IDB id */
            delete(id) { return idbDel(IDB_PHOTO_STORE, id); },
        },

        // ── Utils ─────────────────────────────────────────────────

        /** Export the binary SQLite file as Uint8Array */
        exportSQLite() {
            if (!_db) return null;
            return _db.export();
        },

        /** Execute a raw SQL query and return rows */
        queryRaw(sql, params = []) {
            return query(sql, params);
        },

        /** Execute a raw SQL statement (UPDATE, INSERT, CREATE, etc.) */
        async runRaw(sql, params = []) {
            _db.run(sql, params);
            await persist();
        },

        /** Get stats for all tables */
        getTableStats() {
            const pCount = queryOne('SELECT COUNT(*) as c FROM profiles')?.c ?? 0;
            const cCount = queryOne('SELECT COUNT(*) as c FROM clients')?.c ?? 0;
            const rCount = queryOne('SELECT COUNT(*) as c FROM requests')?.c ?? 0;
            return { profiles: pCount, clients: cCount, requests: rCount };
        },

        async exportJSON() {
            const profiles = query('SELECT * FROM profiles').map(parseProfile);
            const clients  = query('SELECT * FROM clients');
            const requests = query('SELECT * FROM requests');
            return JSON.stringify({ profiles, clients, requests, exportedAt: new Date().toISOString() }, null, 2);
        },

        /** Wipe all data (dev helper) */
        async wipe() {
            _db.run('DELETE FROM profiles');
            _db.run('DELETE FROM clients');
            _db.run('DELETE FROM requests');
            _db.run('DELETE FROM profile_likes');
            await persist();
            await idbGetAll(IDB_PHOTO_STORE).then(rows =>
                Promise.all(rows.map(r => idbDel(IDB_PHOTO_STORE, r.id)))
            );
        },
    };
})();
