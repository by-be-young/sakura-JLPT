import json, re
with open(r'D:\日语自学网站\src\data\reading-n1.js', 'r', encoding='utf-8') as f:
    content = f.read()
start = content.index('[')
end = content.rindex(']')
arr_str = re.sub(r',\s*\]', ']', content[start:end+1])
data = json.loads(arr_str)
print(f'Total: {len(data)} entries')
d = data[0]
print(f'Entry 1 fields: {list(d.keys())}')
has_af = 'Y' if d.get('articleFurigana') else 'N'
af_len = len(d.get('articleFurigana',''))
print(f'  articleFurigana: {has_af} ({af_len} chars)')
has_sf = 'Y' if d['questions'][0].get('stemFurigana') else 'N'
print(f'  question 0 stemFurigana: {has_sf}')
of_count = len(d['questions'][0].get('optionFurigana',[]))
print(f'  question 0 optionFurigana count: {of_count}')
if d.get('analysis'):
    has_anf = 'Y' if d['analysis'][0].get('sentenceFurigana') else 'N'
    print(f'  analysis 0 sentenceFurigana: {has_anf}')
