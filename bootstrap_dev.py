import argparse
import os
import subprocess
import sys


def _run(cmd: list[str], env: dict[str, str]) -> None:
    subprocess.run(cmd, check=True, env=env)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Bootstrap local dev: create DB, migrate, create admin/staff accounts."
    )

    parser.add_argument("--skip-create-db", action="store_true", help="Skip create_db.py")
    parser.add_argument("--skip-migrate", action="store_true", help="Skip manage.py migrate")

    parser.add_argument("--db-host", default=os.environ.get("DB_HOST", "127.0.0.1"))
    parser.add_argument("--db-port", default=os.environ.get("DB_PORT", "3306"))
    parser.add_argument("--db-name", default=os.environ.get("DB_NAME", "cinema_db"))
    parser.add_argument("--db-user", default=os.environ.get("DB_USER", "root"))
    parser.add_argument("--db-password", default=os.environ.get("DB_PASSWORD", ""))

    parser.add_argument("--admin-username", default=os.environ.get("ADMIN_USERNAME", "admin"))
    parser.add_argument("--admin-email", default=os.environ.get("ADMIN_EMAIL", "admin@cinema.local"))
    parser.add_argument("--admin-password", default=os.environ.get("ADMIN_PASSWORD", ""))

    parser.add_argument("--staff-username", default=os.environ.get("STAFF_USERNAME", "staff"))
    parser.add_argument("--staff-email", default=os.environ.get("STAFF_EMAIL", "staff@cinema.local"))
    parser.add_argument("--staff-password", default=os.environ.get("STAFF_PASSWORD", ""))

    args = parser.parse_args()

    env = os.environ.copy()
    env.update(
        {
            "DB_HOST": args.db_host,
            "DB_PORT": str(args.db_port),
            "DB_NAME": args.db_name,
            "DB_USER": args.db_user,
            "DB_PASSWORD": args.db_password,
        }
    )

    if not args.skip_create_db:
        _run([sys.executable, "create_db.py"], env=env)

    if not args.skip_migrate:
        _run([sys.executable, "manage.py", "migrate"], env=env)

    bootstrap_cmd = [
        sys.executable,
        "manage.py",
        "bootstrap_accounts",
        "--admin-username",
        args.admin_username,
        "--admin-email",
        args.admin_email,
        "--staff-username",
        args.staff_username,
        "--staff-email",
        args.staff_email,
    ]
    if args.admin_password:
        bootstrap_cmd += ["--admin-password", args.admin_password]
    if args.staff_password:
        bootstrap_cmd += ["--staff-password", args.staff_password]

    _run(bootstrap_cmd, env=env)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
