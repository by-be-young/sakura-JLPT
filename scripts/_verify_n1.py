import json
with open(r'D:\日语自学网站\src\data\reading-n1.js', 'r', encoding='utf-8') as f:
    content = f.read()
start = content.index('[')
end = content.rindex(']')
arr_str = content[start:end+1]
# Remove trailing comma before ] for JSON parsing (handle ,\n] and ,])
import re
arr_str = re.sub(r',\s*\]', ']', arr_str)
data = json.loads(arr_str)
print(f'Total entries: {len(data)}')
for d in data:
    q_count = len(d['questions'])
    art_sentences = d['article'].count('【')
    has_trans = 'Y' if d['translation'] else 'N'
    ana_count = len(d['analysis'])
    print(f"  id={d['id']} U{d['unit']}-{d['num']}: {art_sentences} sentences, {q_count} questions, trans={has_trans}, ana={ana_count}")
