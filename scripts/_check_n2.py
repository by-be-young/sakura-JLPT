import re
from collections import Counter

with open(r'D:\日语自学网站\src\data\reading-n2.js', 'r', encoding='utf-8') as f:
    content = f.read()

entries = re.findall(r'"id":(\d+)', content)
print('Total entries:', len(entries))
print('IDs:', entries[:5], '...', entries[-5:])

parts = re.findall(r'"part":"([^"]+)"', content)
print('Parts:', Counter(parts))

units = re.findall(r'"unit":(\d+)', content)
print('Units:', Counter(units))

# Check question count
q_count = len(re.findall(r'"stem":', content))
print('Total questions:', q_count)
