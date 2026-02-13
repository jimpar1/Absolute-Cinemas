
try:
    import MySQLdb  # type: ignore[import-not-found]  # noqa: F401
except ModuleNotFoundError:
    import pymysql

    pymysql.install_as_MySQLdb()

