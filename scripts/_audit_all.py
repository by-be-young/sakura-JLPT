import json, re

with open(r'D:\日语自学网站\src\data\reading-n1.js', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.index('[')
end = content.rindex(']')
arr_str = re.sub(r',\s*\]', ']', content[start:end+1])
data = json.loads(arr_str)

print(f'Total entries: {len(data)}')
print(f'{"="*80}')

for d in data:
    print(f'\n【id={d["id"]} U{d["unit"]}-{d["num"]}】{d["unitTitle"]}')
    print(f'  article: {d["article"].count("【")} sentences')
    print(f'  questions: {len(d["questions"])}')
    for i, q in enumerate(d['questions']):
        ans = q['answer']
        opts = q['options']
        if ans < len(opts):
            ans_text = opts[ans][:30]
        else:
            ans_text = 'INDEX OUT OF RANGE!'
        print(f'    Q{i+1}: ans={ans} ({ans_text}) | opts={len(opts)}')
    print(f'  translation: {"Y" if d.get("translation") else "N"} ({len(d.get("translation",""))} chars)')
    print(f'  analysis: {len(d.get("analysis",[]))}')
    # Check for furigana
    has_af = 'Y' if d.get('articleFurigana') else 'N'
    print(f'  articleFurigana: {has_af}')
