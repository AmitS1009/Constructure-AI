import os

env_path = ".env"
new_model = "gemini-2.5-flash"

if os.path.exists(env_path):
    with open(env_path, "r") as f:
        lines = f.readlines()
    
    new_lines = []
    found = False
    for line in lines:
        if line.startswith("GEMINI_MODEL_NAME="):
            new_lines.append(f"GEMINI_MODEL_NAME={new_model}\n")
            found = True
        else:
            new_lines.append(line)
            
    if not found:
        new_lines.append(f"\nGEMINI_MODEL_NAME={new_model}\n")
        
    with open(env_path, "w") as f:
        f.writelines(new_lines)
    print("Updated .env")
else:
    print(".env not found")
