import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_template = False
unclosed_lines = []
for i, line in enumerate(lines):
    # We will just count backticks
    # A backtick can be escaped \`
    # Let's count unescaped backticks
    num_backticks = len(re.findall(r"(?<!\\)`", line))
    if num_backticks % 2 != 0:
        in_template = not in_template
        if in_template:
            unclosed_lines.append(i + 1)
        else:
            unclosed_lines.append(i + 1)

print("Lines with odd backticks:", unclosed_lines)
