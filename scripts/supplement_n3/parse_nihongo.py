import re, json, lxml.html
from collections import Counter
p = r"D:\01-项目\日语自学网站\scripts\supplement_n3\nihongo_n3_vocab.html"
doc = lxml.html.fromstring(open(p, encoding="utf-8").read())

def plain_of(el):
    cp = lxml.html.fromstring(lxml.html.tostring(el, encoding="unicode", method="html"))
    for rt in cp.xpath('.//rt|.//rp'):
        rt.getparent().remove(rt)
    return re.sub(r'\s+', '', cp.text_content()).strip()

out = []
for sec in doc.xpath('//section[contains(concat(" ", normalize-space(@class), " "), " vsec ")]'):
    title = sec.xpath('.//h2')[0].text_content().strip().split()[0]
    for q in sec.xpath('.//div[contains(@class,"vq")]'):
        stem_el = q.xpath('.//p[contains(@class,"stem")]')[0]
        stem_html = lxml.html.tostring(stem_el, encoding="unicode", method="html")
        stem_html = re.sub(r"^<p[^>]*>", "", stem_html)
        stem_html = re.sub(r"</p>$", "", stem_html)
        stem_html = re.sub(r"^\s*\d+\.\s*", "", stem_html)
        stem = re.sub(r"^\d+\.\s*", "", plain_of(stem_el))
        opts = []
        for b in q.xpath('.//button[contains(@class,"vopt")]'):
            spans = b.xpath('.//span')
            opts.append(plain_of(spans[-1]))
        ans = int(q.get("data-a")) + 1
        why = q.xpath('.//div[contains(@class,"vwhy")]')
        why_txt = why[0].text_content().strip() if why else ""
        why_txt = why_txt.split("出典")[0].strip()
        out.append({"qid": q.get("id"), "section": title, "stem": stem, "stem_html": stem_html,
                    "options": opts, "answer": ans, "why_ja": why_txt})
print(len(out)); print(Counter(o["section"] for o in out))
for o in out[:4] + out[43:46]:
    print(o["qid"], o["stem"], o["options"], o["answer"])
json.dump(out, open(r"D:\01-项目\日语自学网站\scripts\supplement_n3\nihongo_raw.json","w",encoding="utf-8"), ensure_ascii=False, indent=1)
