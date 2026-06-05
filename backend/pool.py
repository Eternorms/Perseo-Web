"""
Pool de conexões psycopg — reutiliza conexões entre requests.
Inicializado uma vez no startup do FastAPI.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "app"))

from psycopg_pool import ConnectionPool
import psycopg
from psycopg.rows import dict_row
from psycopg.conninfo import conninfo_to_dict, make_conninfo
from database.db import DATABASE_URL, _Conn

_pool: ConnectionPool | None = None


def _build_conninfo() -> str:
    params = conninfo_to_dict(DATABASE_URL)
    params["port"] = 6543           # session pooler
    params["sslmode"] = "require"
    params["options"] = "-c search_path=perseo,public"
    params.pop("channel_binding", None)
    return make_conninfo(**params)


def _configure(conn: psycopg.Connection) -> None:
    conn.row_factory = dict_row


def init_pool() -> None:
    global _pool
    conninfo = _build_conninfo()
    _pool = ConnectionPool(
        conninfo,
        min_size=2,
        max_size=10,
        open=False,
        configure=_configure,
    )
    _pool.open(wait=False)
    print(f"[pool] iniciado — {_pool.min_size}/{_pool.max_size} conexões")


def get_pooled_conn() -> _Conn:
    if _pool is None:
        raise RuntimeError("Pool não inicializado")
    raw = _pool.getconn()
    return _Conn(raw)


def release_conn(raw_conn: psycopg.Connection) -> None:
    if _pool:
        _pool.putconn(raw_conn)
