import os
import re
import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.getenv("DATABASE_URL", "")

# ── Compatibility shim ──────────────────────────────────────────────────────
# Wraps psycopg so existing code that uses sqlite3-style API continues to work:
#   conn.execute(sql, params)        ← same signature, ? → %s translated
#   conn.executescript(sql)          ← splits on ; and runs each statement
#   cursor.fetchone()[0]             ← positional access on dict rows
#   SELECT last_insert_rowid()       ← translated to SELECT LASTVAL()
#   with get_connection() as conn:   ← commits on success, rolls back on error

_TRANSLATE_PATTERNS = [
    (r'(?i)\bINTEGER PRIMARY KEY AUTOINCREMENT\b', 'BIGSERIAL PRIMARY KEY'),
    (r"(?i)\bdatetime\('now'\)",                   'NOW()'),
    # date('now', '-N days') → cast para TEXT para comparar com colunas TEXT
    (r"(?i)date\('now'\s*,\s*'-(\d+)\s+days?'\)",  r"(CURRENT_DATE - INTERVAL '\1 days')::TEXT"),
    (r'(?i)\bSELECT last_insert_rowid\(\)',         'SELECT LASTVAL()'),
    (r'(?i)\bPRAGMA\s+foreign_keys\s*=\s*ON\b',    'SELECT 1'),
    (r'(?i)\bINSERT OR IGNORE INTO\b',              'INSERT INTO'),
    (r'(?i)\bINSERT OR REPLACE INTO\b',             'INSERT INTO'),
    (r'(?i)\bALTER TABLE (\w+) ADD COLUMN(?! IF NOT EXISTS)\b', r'ALTER TABLE \1 ADD COLUMN IF NOT EXISTS'),
]


def _pg(sql: str) -> str:
    for pat, rep in _TRANSLATE_PATTERNS:
        sql = re.sub(pat, rep, sql)
    return sql.replace('?', '%s')


class _Row(dict):
    """Dict with positional (integer) indexing, like sqlite3.Row."""
    def __init__(self, data: dict):
        super().__init__(data)
        self._vals = list(data.values())

    def __getitem__(self, key):
        if isinstance(key, int):
            return self._vals[key]
        return super().__getitem__(key)


class _Cursor:
    def __init__(self, cur):
        self._cur = cur

    def fetchone(self):
        row = self._cur.fetchone()
        return _Row(row) if isinstance(row, dict) else row

    def fetchall(self):
        return [_Row(r) if isinstance(r, dict) else r for r in self._cur.fetchall()]

    def __iter__(self):
        for row in self._cur:
            yield _Row(row) if isinstance(row, dict) else row

    @property
    def rowcount(self):
        return self._cur.rowcount


class _Conn:
    def __init__(self, conn):
        self._conn = conn

    def execute(self, sql: str, params=None):
        cur = self._conn.cursor(row_factory=dict_row)
        cur.execute(_pg(sql), params or [])
        return _Cursor(cur)

    def executescript(self, script: str):
        for stmt in script.split(';'):
            stmt = stmt.strip()
            if stmt:
                self._conn.execute(_pg(stmt))

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, *_):
        try:
            if exc_type:
                self.rollback()
            else:
                self.commit()
        finally:
            self._conn.close()
        return False


def _parse_db_url(url: str) -> dict:
    """Parser que tolera caracteres especiais na senha (@ [ ] ! etc)."""
    # remove esquema: postgresql:// ou postgres://
    rest = re.sub(r'^postgres(?:ql)?://', '', url)
    # tudo antes do último '@' é userinfo; depois é host/db
    at_idx = rest.rfind('@')
    userinfo = rest[:at_idx]
    hostpart = rest[at_idx + 1:]
    # user:senha — separar apenas no primeiro ':'
    colon = userinfo.index(':')
    user = userinfo[:colon]
    password = userinfo[colon + 1:]
    # host:port/dbname
    slash = hostpart.find('/')
    hostport = hostpart[:slash] if slash != -1 else hostpart
    dbname = hostpart[slash + 1:] if slash != -1 else 'postgres'
    # remove query string do dbname se houver
    dbname = dbname.split('?')[0] or 'postgres'
    if ':' in hostport:
        host, port_str = hostport.rsplit(':', 1)
        port = int(port_str)
    else:
        host, port = hostport, 5432
    return {"host": host, "port": port, "dbname": dbname, "user": user, "password": password}


def get_connection() -> _Conn:
    params = _parse_db_url(DATABASE_URL)
    # tenta porta do .env primeiro; fallback para session pooler (6543)
    for port, ssl in [(params["port"], "require"), (6543, "require"), (params["port"], "prefer")]:
        try:
            conn = psycopg.connect(**{**params, "port": port},
                                   sslmode=ssl, connect_timeout=15,
                                   options="-c search_path=perseo,public")
            return _Conn(conn)
        except Exception:
            continue
    raise ConnectionError("Não foi possível conectar ao banco. Verifique DATABASE_URL e credenciais.")


def init_db() -> None:
    with get_connection() as conn:
        conn.execute("CREATE SCHEMA IF NOT EXISTS perseo")
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS businesses (
                id          BIGSERIAL PRIMARY KEY,
                name        TEXT NOT NULL,
                type        TEXT NOT NULL,
                description TEXT,
                active      INTEGER DEFAULT 1,
                created_at  TEXT DEFAULT (NOW()::TEXT)
            );

            CREATE TABLE IF NOT EXISTS clients (
                id              BIGSERIAL PRIMARY KEY,
                business_id     INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
                name            TEXT NOT NULL,
                brand           TEXT NOT NULL,
                niche           TEXT NOT NULL,
                plan            TEXT NOT NULL,
                ig_page_id      TEXT,
                meta_token      TEXT,
                drive_folder_id TEXT,
                active          INTEGER DEFAULT 1,
                created_at      TEXT DEFAULT (NOW()::TEXT)
            );

            CREATE TABLE IF NOT EXISTS ad_references (
                id          BIGSERIAL PRIMARY KEY,
                client_id   INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                advertiser  TEXT,
                ad_text     TEXT,
                ad_url      TEXT,
                fetched_at  TEXT DEFAULT (NOW()::TEXT)
            );

            CREATE TABLE IF NOT EXISTS videos (
                id              BIGSERIAL PRIMARY KEY,
                client_id       INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                script          TEXT NOT NULL,
                heygen_job_id   TEXT,
                drive_file_id   TEXT,
                local_path      TEXT,
                status          TEXT NOT NULL DEFAULT 'pending'
                                CHECK(status IN ('pending','generating','ready','scheduled','published','failed')),
                scheduled_at    TEXT,
                published_at    TEXT,
                meta_post_id    TEXT,
                created_at      TEXT DEFAULT (NOW()::TEXT)
            );

            CREATE TABLE IF NOT EXISTS campaign_results (
                id            BIGSERIAL PRIMARY KEY,
                client_id     INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                video_id      INTEGER REFERENCES videos(id) ON DELETE SET NULL,
                platform      TEXT NOT NULL DEFAULT 'meta',
                campaign_name TEXT,
                date_start    TEXT,
                date_end      TEXT,
                impressions   INTEGER,
                clicks        INTEGER,
                spend         REAL,
                roas          REAL,
                cpa           REAL,
                hook_rate     REAL,
                notes         TEXT,
                created_at    TEXT DEFAULT (NOW()::TEXT)
            );

            CREATE TABLE IF NOT EXISTS activity_log (
                id          BIGSERIAL PRIMARY KEY,
                business_id INTEGER REFERENCES businesses(id) ON DELETE SET NULL,
                entity_type TEXT,
                entity_id   INTEGER,
                action      TEXT NOT NULL,
                details     TEXT,
                created_at  TEXT DEFAULT (NOW()::TEXT)
            );

            CREATE TABLE IF NOT EXISTS drive_folders (
                key        TEXT PRIMARY KEY,
                folder_id  TEXT NOT NULL,
                name       TEXT,
                created_at TEXT DEFAULT (NOW()::TEXT)
            );

            CREATE TABLE IF NOT EXISTS client_assets (
                id            BIGSERIAL PRIMARY KEY,
                client_id     INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                asset_type    TEXT NOT NULL,
                filename      TEXT NOT NULL,
                local_path    TEXT,
                drive_file_id TEXT,
                drive_link    TEXT,
                notes         TEXT,
                created_at    TEXT DEFAULT (NOW()::TEXT)
            )
        """)

        # ── Knowledge Graph (cérebro de inteligência criativa) ───────────────
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS kg_entities (
                id         BIGSERIAL PRIMARY KEY,
                type       TEXT NOT NULL,
                key        TEXT NOT NULL,
                attrs      JSONB DEFAULT '{}'::jsonb,
                created_at TEXT DEFAULT (NOW()::TEXT),
                UNIQUE (type, key)
            );

            CREATE TABLE IF NOT EXISTS kg_edges (
                id         BIGSERIAL PRIMARY KEY,
                src_id     BIGINT NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
                rel        TEXT NOT NULL,
                dst_id     BIGINT NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
                weight     REAL DEFAULT 1,
                attrs      JSONB DEFAULT '{}'::jsonb,
                created_at TEXT DEFAULT (NOW()::TEXT),
                UNIQUE (src_id, rel, dst_id)
            );

            CREATE INDEX IF NOT EXISTS idx_kg_edges_src ON kg_edges (src_id, rel);
            CREATE INDEX IF NOT EXISTS idx_kg_edges_dst ON kg_edges (dst_id, rel)
        """)

        for sql in [
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS product_description TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS price_range TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS usp TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS target_age TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS target_gender TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS target_interests TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS pain_points TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS objections TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS tone_profile TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS forbidden_words TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS style_references TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS meta_ad_account_id TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_ads_customer_id TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS monthly_budget REAL DEFAULT 0",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS current_roas REAL",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS current_cpa REAL",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'active'",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan_value REAL DEFAULT 0",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_contact_at TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_sheet_id TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_email TEXT",
            "ALTER TABLE videos ADD COLUMN IF NOT EXISTS youtube_video_id TEXT",
            "ALTER TABLE videos ADD COLUMN IF NOT EXISTS calendar_event_id TEXT",
            "ALTER TABLE campaign_results ADD COLUMN IF NOT EXISTS fraud_rate REAL",
            "ALTER TABLE campaign_results ADD COLUMN IF NOT EXISTS fraud_clicks INTEGER",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS adtruth_api_key TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_whatsapp TEXT",
        ]:
            conn.execute(sql)
