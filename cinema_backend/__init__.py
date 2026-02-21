
# Force pymysql as MySQLdb — the installed mysqlclient 1.4.6 is too old for Django 5
import pymysql
pymysql.install_as_MySQLdb()
pymysql.version_info = (2, 2, 1, "final", 0)
