import os

specs_dir = "/Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda Link/docs/superpowers"
keywords = ["descargas", "stripe", "ventas y caja", "primeros pasos", "fidelización"]

print("Searching specs and plans for keywords...")

for root, dirs, files in os.walk(specs_dir):
    for file in files:
        if file.endswith(".md"):
            path = os.path.join(root, file)
            matched = []
            with open(path, "r", encoding="utf-8") as f:
                content = f.read().lower()
                for kw in keywords:
                    if kw in content:
                        matched.append(kw)
            if matched:
                print(f"File: {path}")
                print(f"  Matched: {matched}")
