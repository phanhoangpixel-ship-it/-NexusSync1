import re

with open('src/routes/sales.routes.ts', 'r') as f:
    code = f.read()

pattern = re.compile(r'async function findOrCreateOrder\(lookupKey: string \| number\) \{.*?return created\.length > 0 \? created\[0\] : null;\n\}', re.DOTALL)
match = pattern.search(code)
if match:
    code = code[:match.start()] + "" + code[match.end():]
    print("findOrCreateOrder removed.")
else:
    print("Could not find findOrCreateOrder.")

with open('src/routes/sales.routes.ts', 'w') as f:
    f.write(code)

