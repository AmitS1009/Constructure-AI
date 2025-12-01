import os

env_path = ".env"
new_lines = []

# Read existing
if os.path.exists(env_path):
    with open(env_path, "r") as f:
        lines = f.readlines()
        for line in lines:
            if not line.startswith("DATABASE_URL") and not line.startswith("SECRET_KEY"):
                new_lines.append(line)

# Append new vars
new_lines.append("DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/project_brain\n")
new_lines.append("SECRET_KEY=supersecretkey\n")
new_lines.append("ALGORITHM=HS256\n")
new_lines.append("ACCESS_TOKEN_EXPIRE_MINUTES=30\n")

with open(env_path, "w") as f:
    f.writelines(new_lines)

print("Updated .env")
