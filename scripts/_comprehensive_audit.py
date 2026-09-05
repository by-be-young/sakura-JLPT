import json, re

with open(r'D:\日语自学网站\src\data\reading-n1.js', 'r', encoding='utf-8') as f:
    content = f.read()
start = content.index('[')
end = content.rindex(']')
arr_str = re.sub(r',\s*\]', ']', content[start:end+1])
data = json.loads(arr_str)

print("=== COMPREHENSIVE DATA AUDIT ===\n")

issues = []

for d in data:
    aid = d['id']
    
    # Check required fields
    if not d.get('article'):
        issues.append(f"id={aid}: missing article")
    if not d.get('translation'):
        issues.append(f"id={aid}: missing translation")
    if not d.get('questions'):
        issues.append(f"id={aid}: missing questions")
    
    # Check furigana fields
    if not d.get('articleFurigana'):
        issues.append(f"id={aid}: missing articleFurigana")
    
    for i, q in enumerate(d['questions']):
        if not q.get('stem'):
            issues.append(f"id={aid} Q{i+1}: missing stem")
        if not q.get('options'):
            issues.append(f"id={aid} Q{i+1}: missing options")
        if q.get('answer') is None:
            issues.append(f"id={aid} Q{i+1}: missing answer")
        elif q['answer'] >= len(q['options']):
            issues.append(f"id={aid} Q{i+1}: answer index {q['answer']} out of range (opts={len(q['options'])})")
        
        # Check furigana for questions
        if not q.get('stemFurigana'):
            issues.append(f"id={aid} Q{i+1}: missing stemFurigana")
        if not q.get('optionFurigana'):
            issues.append(f"id={aid} Q{i+1}: missing optionFurigana")
    
    # Check analysis
    for j, a in enumerate(d.get('analysis', [])):
        if not a.get('sentence'):
            issues.append(f"id={aid} analysis[{j}]: missing sentence")
        if not a.get('note'):
            issues.append(f"id={aid} analysis[{j}]: missing note")
        if not a.get('sentenceFurigana'):
            issues.append(f"id={aid} analysis[{j}]: missing sentenceFurigana")

# Check id uniqueness
ids = [d['id'] for d in data]
if len(ids) != len(set(ids)):
    issues.append(f"Duplicate IDs found: {[x for x in ids if ids.count(x) > 1]}")

# Check id sequence
expected_ids = list(range(1, 26))
if ids != expected_ids:
    issues.append(f"ID sequence mismatch: expected {expected_ids}, got {ids}")

# Check unit/num assignment
for d in data:
    expected_unit = (d['id'] - 1) // 5 + 1
    expected_num = (d['id'] - 1) % 5 + 1
    if d['unit'] != expected_unit:
        issues.append(f"id={d['id']}: unit={d['unit']}, expected {expected_unit}")
    if d['num'] != expected_num:
        issues.append(f"id={d['id']}: num={d['num']}, expected {expected_num}")

if issues:
    print(f"ISSUES FOUND ({len(issues)}):")
    for issue in issues:
        print(f"  - {issue}")
else:
    print("No structural issues found.")

print(f"\n=== SUMMARY ===")
print(f"Total entries: {len(data)}")
print(f"Total questions: {sum(len(d['questions']) for d in data)}")
print(f"Entries with translation: {sum(1 for d in data if d.get('translation'))}")
print(f"Entries with analysis: {sum(1 for d in data if d.get('analysis'))}")
print(f"Total analysis entries: {sum(len(d.get('analysis',[])) for d in data)}")
print(f"Entries with articleFurigana: {sum(1 for d in data if d.get('articleFurigana'))}")

# Print translations for spot check
print(f"\n=== TRANSLATION SPOT CHECK ===")
for aid in [1, 12, 21, 25]:
    d = next(x for x in data if x['id'] == aid)
    print(f"\nid={aid}: {d['translation'][:200]}...")
