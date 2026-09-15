import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace any sequence of 
#         )}
#         )}
# with just one
content = re.sub(r"(\s*)\)\}(\s*)\)\}", r"\1)}", content)
content = re.sub(r"(\s*)\)\}(\s*)\)\}", r"\1)}", content) # run again just in case there are 3

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch clean applied")
