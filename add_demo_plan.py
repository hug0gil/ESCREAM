import subprocess
import os


DB_CONTAINER = os.getenv("ESCREAM_DB_CONTAINER", "escream-pg")
DB_USER = os.getenv("ESCREAM_DB_USER", "escream")
DB_NAME = os.getenv("ESCREAM_DB_NAME", "escream")

SQL = """
INSERT INTO plans (name, price, devices_allowed, created_at, updated_at)
SELECT 'Python Demo', 1.99, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM plans WHERE name = 'Python Demo'
);

SELECT id, name, price, devices_allowed
FROM plans
WHERE name = 'Python Demo';
"""


def main() -> None:
    command = [
        "docker",
        "exec",
        "-i",
        DB_CONTAINER,
        "psql",
        "-U",
        DB_USER,
        "-d",
        DB_NAME,
        "-c",
        SQL,
    ]

    print("Adding demo plan to ESCREAM database...")
    subprocess.run(command, check=True)
    print("Done.")


if __name__ == "__main__":
    main()
