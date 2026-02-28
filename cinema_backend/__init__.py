from __future__ import annotations


try:
	import MySQLdb  # noqa: F401
except ModuleNotFoundError:
	try:
		import pymysql
	except ModuleNotFoundError:
		pass
	else:
		pymysql.install_as_MySQLdb()

