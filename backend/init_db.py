import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "app"))

import psycopg
from psycopg.rows import dict_row
from psycopg.conninfo import conninfo_to_dict, make_conninfo
from database.db import DATABASE_URL


def _make_conninfo() -> str:
    params = conninfo_to_dict(DATABASE_URL)
    params["port"] = 6543
    params["sslmode"] = "require"
    params["options"] = "-c search_path=perseo,public"
    params.pop("channel_binding", None)
    return make_conninfo(**params)


def init_web_db() -> None:
    conninfo = _make_conninfo()
    with psycopg.connect(conninfo, row_factory=dict_row, connect_timeout=20) as conn:
        conn.autocommit = False

        conn.execute("CREATE SCHEMA IF NOT EXISTS perseo")

        # Garante que a tabela businesses existe (pode não existir se init_db do desktop nunca rodou)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS businesses (
                id          BIGSERIAL PRIMARY KEY,
                name        TEXT NOT NULL,
                type        TEXT NOT NULL,
                description TEXT,
                active      INTEGER DEFAULT 1,
                created_at  TEXT DEFAULT (NOW()::TEXT)
            )
        """)

        # Garante que o negócio Perseo existe
        row = conn.execute(
            "SELECT COUNT(*) as n FROM businesses WHERE active = 1"
        ).fetchone()
        if not row or row["n"] == 0:
            conn.execute(
                "INSERT INTO businesses (name, type, description) "
                "VALUES (%s, %s, %s)",
                ["Perseo Agency", "agency", "Agência de Marketing Digital"],
            )

        tables = [
            """CREATE TABLE IF NOT EXISTS client_portal_tokens (
                id         BIGSERIAL PRIMARY KEY,
                client_id  BIGINT REFERENCES clients(id) ON DELETE CASCADE,
                token      TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
                label      TEXT,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )""",
            """CREATE TABLE IF NOT EXISTS agency_users (
                id            BIGSERIAL PRIMARY KEY,
                email         TEXT UNIQUE NOT NULL,
                name          TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role          TEXT DEFAULT 'manager'
                              CHECK(role IN ('admin','manager','viewer')),
                active        BOOLEAN DEFAULT TRUE,
                created_at    TIMESTAMP DEFAULT NOW()
            )""",
            """CREATE TABLE IF NOT EXISTS creative_approvals (
                id              BIGSERIAL PRIMARY KEY,
                client_id       BIGINT REFERENCES clients(id) ON DELETE CASCADE,
                video_id        BIGINT REFERENCES videos(id) ON DELETE SET NULL,
                title           TEXT,
                description     TEXT,
                media_url       TEXT,
                thumbnail_url   TEXT,
                status          TEXT DEFAULT 'pending'
                                CHECK(status IN ('pending','approved','rejected','revision')),
                client_feedback TEXT,
                submitted_at    TIMESTAMP DEFAULT NOW(),
                decided_at      TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS chat_messages (
                id          BIGSERIAL PRIMARY KEY,
                client_id   BIGINT REFERENCES clients(id) ON DELETE CASCADE,
                sender_type TEXT NOT NULL CHECK(sender_type IN ('agency','client','bot')),
                sender_name TEXT,
                content     TEXT,
                attachments JSONB DEFAULT '[]',
                read_at     TIMESTAMP,
                created_at  TIMESTAMP DEFAULT NOW()
            )""",
            """CREATE TABLE IF NOT EXISTS client_uploads (
                id            BIGSERIAL PRIMARY KEY,
                client_id     BIGINT REFERENCES clients(id) ON DELETE CASCADE,
                filename      TEXT NOT NULL,
                drive_file_id TEXT,
                drive_link    TEXT,
                upload_type   TEXT,
                notes         TEXT,
                created_at    TIMESTAMP DEFAULT NOW()
            )""",
            """CREATE TABLE IF NOT EXISTS notifications (
                id         BIGSERIAL PRIMARY KEY,
                client_id  BIGINT REFERENCES clients(id) ON DELETE CASCADE,
                type       TEXT NOT NULL,
                title      TEXT NOT NULL,
                body       TEXT,
                data       JSONB,
                read_at    TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )""",
            """CREATE TABLE IF NOT EXISTS appointments (
                id           BIGSERIAL PRIMARY KEY,
                client_id    BIGINT REFERENCES clients(id) ON DELETE CASCADE,
                title        TEXT NOT NULL,
                scheduled_at TIMESTAMP NOT NULL,
                duration_min INTEGER DEFAULT 60,
                meet_link    TEXT,
                notes        TEXT,
                status       TEXT DEFAULT 'scheduled'
                             CHECK(status IN ('scheduled','completed','cancelled')),
                created_at   TIMESTAMP DEFAULT NOW()
            )""",
            """CREATE TABLE IF NOT EXISTS tasks (
                id          BIGSERIAL PRIMARY KEY,
                client_id   BIGINT REFERENCES clients(id) ON DELETE SET NULL,
                title       TEXT NOT NULL,
                description TEXT,
                due_date    DATE,
                priority    TEXT DEFAULT 'medium'
                            CHECK(priority IN ('low','medium','high')),
                status      TEXT DEFAULT 'todo'
                            CHECK(status IN ('todo','in_progress','done')),
                assigned_to TEXT,
                created_at  TIMESTAMP DEFAULT NOW(),
                updated_at  TIMESTAMP DEFAULT NOW()
            )""",
            """CREATE TABLE IF NOT EXISTS client_funnel_stages (
                id         BIGSERIAL PRIMARY KEY,
                client_id  BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                value      TEXT NOT NULL,
                label      TEXT NOT NULL,
                color      TEXT DEFAULT 'zinc',
                position   INTEGER NOT NULL DEFAULT 0,
                UNIQUE (client_id, value)
            )""",
        ]

        for sql in tables:
            conn.execute(sql)

        for alter in [
            "ALTER TABLE creative_approvals ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP",
            "ALTER TABLE creative_approvals ADD COLUMN IF NOT EXISTS meta_post_id TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS perseo_client_id BIGINT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS ig_page_id TEXT",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS meta_token TEXT",
        ]:
            conn.execute(alter)

        conn.commit()
        print("[init_db] schema perseo OK")


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "app", ".env"))
    init_web_db()
    print("Web DB OK")
