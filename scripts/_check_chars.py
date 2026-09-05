import json

with open(r'D:\日语自学网站\scripts\n1_full_text.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

# Look at page 11 article raw characters
t = pages[10]['text']  # page 11
# Find the article start
lines = t.split('\n')
for i, line in enumerate(lines):
    if 'ささげる言葉' in line or '何事も' in line:
        # Print this and next few lines with char codes
        for j in range(i, min(i+8, len(lines))):
            line = lines[j]
            print(f'Line {j}: {repr(line[:100])}')
            # Show first 10 chars with codepoints
            for ch in line[:15]:
                if ord(ch) > 127 or not ch.isalnum():
                    print(f'  U+{ord(ch):04X} = {ch}')
        break
