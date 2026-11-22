"""Create the first administrator account for local/development use.

Run from the project root with the configured .env file:
    python scripts/create_admin.py

The password is prompted securely and stored as a bcrypt hash.
This script never prints credentials or modifies existing users.
"""

import argparse
import asyncio
import getpass

from app.db_handler.mongodb import close_database, initialize_database
from app.repository.user_repository import UserRepository
from app.service.auth_service import AuthService


async def create_admin(name: str, email: str, password: str) -> None:
    repository = UserRepository()
    existing = await repository.find_by_email(email)
    if existing:
        raise SystemExit(
            f"An account already exists for {email}. "
            "Use that account if it is already an ADMIN; do not create a duplicate."
        )

    service = AuthService(user_repository=repository)
    user = await service.register_user(
        name=name,
        email=email,
        password=password,
        role="ADMIN",
    )
    print(f"Admin account created successfully: {user['email']}")


async def main() -> None:
    parser = argparse.ArgumentParser(description="Create an InfraMind admin account")
    parser.add_argument("--name", help="Administrator full name")
    parser.add_argument("--email", help="Administrator email")
    parser.add_argument("--password", help="Administrator password (omit to prompt securely)")
    args = parser.parse_args()

    name = (args.name or input("Admin full name: ")).strip()
    email = (args.email or input("Admin email: ")).strip().lower()
    password = args.password or getpass.getpass("Admin password (min 8 characters): ")

    if not name or not email or len(password) < 8:
        raise SystemExit("Name and email are required; password must contain at least 8 characters.")

    try:
        await initialize_database()
        await create_admin(name, email, password)
    finally:
        await close_database()


if __name__ == "__main__":
    asyncio.run(main())
