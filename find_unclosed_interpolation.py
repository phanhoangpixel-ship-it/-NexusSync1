import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    opens = line.count('${')
    closes = line.count('}')
    if opens > 0 and opens > closes:
        print("Possible unclosed interpolation at line", i+1, line.strip())
