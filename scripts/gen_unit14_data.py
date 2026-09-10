# -*- coding: utf-8 -*-
# 生成 Unit14 数据（Part3 実践編 第1回 N2聴解模擬テスト）：words.js / questions.js / knowledge.js / index.js
import json

D = r'D:\日语自学网站\src\data\listening\unit14'

words = {'groups': []}
with open(D + r'\words.js', 'w', encoding='utf-8') as f:
    f.write('// 听解 Unit14 Part3 実践編 第1回 N2聴解模擬テスト · 词汇板块（模拟测试无独立词汇表）\nexport default ' + json.dumps(words, ensure_ascii=False, indent=1))

def q(n, audio, text, opts, ans, sub='', questions=None):
    return {'n': n, 'sub': sub, 'audio': audio, 'text': text, 'options': opts, 'answer': ans,
            'questions': questions or None,
            'textFuri': '', 'script': '', 'scriptFuri': '', 'vocab': [], 'analysis': []}

def sq(label, options, answer):
    return {'q': label, 'options': options, 'answer': answer}

# ---------- 問題1 課題理解（1-5番） ----------
q1 = [
    q('1', '3-2', '', ['スケジュールを確認する', '広報課に電話する', '会議の資料を作成する', '山田物産にカタログを送る'], '2'),
    q('2', '3-3', '', ['吉田さんに送ってもらう', '山崎さんに送ってもらう', '部長に持ってきてもらう', '女の人に持ってきてもらう'], '4'),
    q('3', '3-4', '', ['預かり票を取りに行く', '着替えてくる', '家に帰る', 'サインする'], '4'),
    q('4', '3-5', '', ['12人用の個室を予約する', '懇親会の場所を変える', '参加者の数を確認する', '予約時間を8時半に変える'], '3'),
    q('5', '3-6', '', ['7月10日に電話で申し込む', '7月10日に受付で2,000円を払う', '6月8日にインターネットで申し込む', '6月8日に銀行で2,000円を払う'], '3'),
]

# ---------- 問題2 ポイント理解（1-6番） ----------
q2 = [
    q('1', '3-8', '', ['試験の成績がよくないから', '出席状況がよくないから', '単位が足りなくなったから', '集中力が足りないから'], '2'),
    q('2', '3-9', '', ['岡村さんか課長', '岡村さんか中田さん', '黒沢さんか岡村さん', '黒沢さんか中田さん'], '3'),
    q('3', '3-10', '', ['月曜日', '火曜日', '木曜日', '日曜日'], '2'),
    q('4', '3-11', '', ['身長', '性格', '収入', '見かけ'], '2'),
    q('5', '3-12', '', ['仕事のやり方がよくないから', '部下に信頼されていないから', '役員会の発表がよくなかったから', '今年度の営業成績がよくなかったから'], '3'),
    q('6', '3-13', '', ['A社', 'B社', 'C社', 'D社'], '2'),
]

# ---------- 問題3 概要理解（1-5番，选项在录音中，用①②③④作答） ----------
LISTEN = '请听录音作答，选项在录音中（①～④）。'
NUM_OPTS = ['①', '②', '③', '④']
q3 = [
    q('1', '3-15', LISTEN, NUM_OPTS, '1'),
    q('2', '3-16', LISTEN, NUM_OPTS, '3'),
    q('3', '3-17', LISTEN, NUM_OPTS, '1'),
    q('4', '3-18', LISTEN, NUM_OPTS, '4'),
    q('5', '3-19', LISTEN, NUM_OPTS, '3'),
]

# ---------- 問題4 即時応答（1-12番，选项在录音中，用①②③④作答） ----------
q4 = [
    q('1', '3-21', LISTEN, NUM_OPTS, '2'),
    q('2', '3-22', LISTEN, NUM_OPTS, '2'),
    q('3', '3-23', LISTEN, NUM_OPTS, '1'),
    q('4', '3-24', LISTEN, NUM_OPTS, '3'),
    q('5', '3-25', LISTEN, NUM_OPTS, '2'),
    q('6', '3-26', LISTEN, NUM_OPTS, '3'),
    q('7', '3-27', LISTEN, NUM_OPTS, '1'),
    q('8', '3-28', LISTEN, NUM_OPTS, '1'),
    q('9', '3-29', LISTEN, NUM_OPTS, '2'),
    q('10', '3-30', LISTEN, NUM_OPTS, '2'),
    q('11', '3-31', LISTEN, NUM_OPTS, '3'),
    q('12', '3-32', LISTEN, NUM_OPTS, '1'),
]

# ---------- 問題5 統合理解 ----------
q5a = [
    q('1', '3-33', LISTEN, NUM_OPTS, '2'),
    q('2', '3-34', LISTEN, NUM_OPTS, '3'),
]
q5b = [q('3', '3-35', '先听一段较长的会话，再听两个问题并作答。', [], '4、1',
         questions=[sq('質問1（问题在录音中，请听录音作答）', ['地下1階', '1階', '2階', '3階'], '4'),
                    sq('質問2（问题在录音中，请听录音作答）', ['地下1階', '1階', '2階', '3階'], '1')])]

questions = {
    'title': '第1回 N2聴解模擬テスト',
    'audio': '3-1～3-35',
    'qrPage': 267,
    'sections': [
        {'section': 1, 'type': 'select', 'audio': '3-2～3-6', 'qrPage': 267, 'title': '問題1 課題理解（1～5番）', 'items': q1},
        {'section': 2, 'type': 'select', 'audio': '3-8～3-13', 'qrPage': 267, 'title': '問題2 ポイント理解（1～6番）', 'items': q2},
        {'section': 3, 'type': 'select', 'audio': '3-15～3-19', 'qrPage': 267, 'title': '問題3 概要理解（1～5番）', 'items': q3},
        {'section': 4, 'type': 'select', 'audio': '3-21～3-32', 'qrPage': 267, 'title': '問題4 即時応答（1～12番）', 'items': q4},
        {'section': 5, 'type': 'select', 'audio': '3-33～3-34', 'qrPage': 267, 'title': '問題5 統合理解（1番・2番）', 'items': q5a},
        {'section': 6, 'type': 'select', 'audio': '3-35', 'qrPage': 267, 'title': '問題5 統合理解（3番）', 'items': q5b},
    ],
}
with open(D + r'\questions.js', 'w', encoding='utf-8') as f:
    f.write('// 听解 Unit14 Part3 実践編 第1回 N2聴解模擬テスト · 题目板块\n// 音频：3-1～3-35（例 3-1/3-7/3-14/3-20 为演示，正式题从1番起）\n// 問題3/4/5的1・2番无印刷选项，选项在录音中；答案见作答后显示或正解一览\nexport default ' + json.dumps(questions, ensure_ascii=False, indent=1))

# ================= knowledge（模拟测试构成+正解一览） =================
def T(heading, head, rows):
    return {'heading': heading, 'audio': '', 'kind': 'table', 'intro': '',
            'head': head,
            'pairs': [{'c': '', 'l': l, 'le': le, 'r': r, 're': re, 'lFuri': '', 'leFuri': '', 'rFuri': '', 'reFuri': ''} for l, le, r, re in rows]}

knowledge = {
    'title': '第1回 N2聴解模擬テスト',
    'audio': '3-1～3-35',
    'qrPages': [267],
    'intro': '本回为全真模拟测试，题型、题量与正式考试完全一致：問題1課題理解（5题）→問題2ポイント理解（6题）→問題3概要理解（5题）→問題4即時応答（12题）→問題5統合理解（3题），共31题。听力音频请扫描上方二维码获取（3-1～3-35）。問題1、2选项印在试卷上；問題3、4及問題5的1・2番选项在录音中。',
    'parts': [
        T('1. 测试构成', ['問題', '题型', '题数', '音频'], [
            ('問題1', '課題理解', '5题', '3-2～3-6（例3-1）'),
            ('問題2', 'ポイント理解', '6题', '3-8～3-13（例3-7）'),
            ('問題3', '概要理解', '5题', '3-15～3-19（例3-14）'),
            ('問題4', '即時応答', '12题', '3-21～3-32（例3-20）'),
            ('問題5', '統合理解', '3题（3番含2问）', '3-33～3-35'),
        ]),
        T('2. 正解一览（第1回）', ['問題', '答案', '', ''], [
            ('問題1 課題理解', '1=2 2=4 3=4 4=3 5=3', '', ''),
            ('問題2 ポイント理解', '1=2 2=3 3=2 4=2 5=3 6=2', '', ''),
            ('問題3 概要理解', '1=1 2=3 3=1 4=4 5=3', '', ''),
            ('問題4 即時応答', '1=2 2=2 3=1 4=3 5=2 6=3 7=1 8=1 9=2 10=2 11=3 12=1', '', ''),
            ('問題5 統合理解', '1番=2 2番=3 3番（質問1=4 質問2=1）', '', ''),
        ]),
    ],
}
with open(D + r'\knowledge.js', 'w', encoding='utf-8') as f:
    f.write('// 听解 Unit14 Part3 実践編 第1回 N2聴解模擬テスト · 补充知识（构成与正解）\nexport default ' + json.dumps(knowledge, ensure_ascii=False, indent=1))

index = '''// 听解 Unit14 Part3 実践編 第1回 N2聴解模擬テスト
import words from './words.js'
import questions from './questions.js'
import knowledge from './knowledge.js'

export default {
  id: 14,
  theme: '実践編 第1回 模擬テスト',
  words,
  questions,
  knowledge,
}
'''
with open(D + r'\index.js', 'w', encoding='utf-8') as f:
    f.write(index)

print('q1:', len(q1), 'q2:', len(q2), 'q3:', len(q3), 'q4:', len(q4), 'q5a:', len(q5a), 'q5b:', len(q5b))
print('sections:', len(questions['sections']), 'items:', sum(len(s['items']) for s in questions['sections']))
print('knowledge parts:', len(knowledge['parts']))
