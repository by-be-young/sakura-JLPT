# -*- coding: utf-8 -*-
# 生成 Unit15 数据（Part3 実践編 第2回 N2聴解模擬テスト）：words.js / questions.js / knowledge.js / index.js
import json

D = r'D:\日语自学网站\src\data\listening\unit15'

words = {'groups': []}
with open(D + r'\words.js', 'w', encoding='utf-8') as f:
    f.write('// 听解 Unit15 Part3 実践編 第2回 N2聴解模擬テスト · 词汇板块（模拟测试无独立词汇表）\nexport default ' + json.dumps(words, ensure_ascii=False, indent=1))

def q(n, audio, text, opts, ans, sub='', questions=None):
    return {'n': n, 'sub': sub, 'audio': audio, 'text': text, 'options': opts, 'answer': ans,
            'questions': questions or None,
            'textFuri': '', 'script': '', 'scriptFuri': '', 'vocab': [], 'analysis': []}

def sq(label, options, answer):
    return {'q': label, 'options': options, 'answer': answer}

# ---------- 問題1 課題理解（1-5番） ----------
q1 = [
    q('1', '3-37', '', ['資料を作成する', '資料をコピーする', '人数を確認する', '課長に確認してもらう'], '4'),
    q('2', '3-38', '', ['渋谷支店に行く', '病院にお見舞いに行く', '社内メールを出す', '年賀状を出す'], '3'),
    q('3', '3-39', '', ['本を返しに行く', '家賃を払いに行く', '買い物に行く', '別荘を買いに行く'], '2'),
    q('4', '3-40', '', ['床を拭く', '服を着替える', '水をまく', 'ものを補充する'], '2'),
    q('5', '3-41', '', ['宮崎さんに電話をする', '美川さんから本を借りる', 'レポートを出しに行く', 'データを集める'], '1'),
]

# ---------- 問題2 ポイント理解（1-6番） ----------
q2 = [
    q('1', '3-43', '', ['店長にしかられたから', 'お客さんにおこられたから', '計算を間違えたから', '首になると思ったから'], '1'),
    q('2', '3-44', '', ['お母さんが病気で倒れたから', '友だちが実家に帰ってしまったから', '子どもの面倒を見ないといけないから', '急に出張が入ったから'], '3'),
    q('3', '3-45', '', ['フリーライター', 'お店の経営', '英語教師', '弁護士'], '1'),
    q('4', '3-46', '', ['雰囲気がよくないこと', 'サービスが悪いこと', '値段が高いこと', 'カクテルが少ないこと'], '2'),
    q('5', '3-47', '', ['仕事の内容が簡単なこと', '大事な仕事を任されること', 'いろいろ勉強になること', '給料を多くもらえること'], '2'),
    q('6', '3-48', '', ['12月28日', '12月30日', '12月31日', '1月1日'], '3'),
]

# ---------- 問題3 概要理解（1-5番，无印刷选项） ----------
LISTEN = '请听录音作答，选项在录音中（①～④）。'
q3 = [
    q('1', '3-50', LISTEN, [], '2'),
    q('2', '3-51', LISTEN, [], '1'),
    q('3', '3-52', LISTEN, [], '2'),
    q('4', '3-53', LISTEN, [], '4'),
    q('5', '3-54', LISTEN, [], '3'),
]

# ---------- 問題4 即時応答（1-12番，无印刷选项） ----------
q4 = [
    q('1', '3-56', LISTEN, [], '2'),
    q('2', '3-57', LISTEN, [], '3'),
    q('3', '3-58', LISTEN, [], '1'),
    q('4', '3-59', LISTEN, [], '2'),
    q('5', '3-60', LISTEN, [], '1'),
    q('6', '3-61', LISTEN, [], '3'),
    q('7', '3-62', LISTEN, [], '1'),
    q('8', '3-63', LISTEN, [], '1'),
    q('9', '3-64', LISTEN, [], '2'),
    q('10', '3-65', LISTEN, [], '1'),
    q('11', '3-66', LISTEN, [], '1'),
    q('12', '3-67', LISTEN, [], '2'),
]

# ---------- 問題5 統合理解 ----------
q5a = [
    q('1', '3-68', LISTEN, [], '3'),
    q('2', '3-69', LISTEN, [], '2'),
]
q5b = [q('3', '3-70', '先听一段较长的会话，再听两个问题并作答。', [], '1、4',
         questions=[sq('質問1（问题在录音中，请听录音作答）', ['A社', 'B社', 'C社', 'D社'], '1'),
                    sq('質問2（问题在录音中，请听录音作答）', ['A社', 'B社', 'C社', 'D社'], '4')])]

questions = {
    'title': '第2回 N2聴解模擬テスト',
    'audio': '3-36～3-70',
    'qrPage': 273,
    'sections': [
        {'section': 1, 'type': 'select', 'audio': '3-37～3-41', 'qrPage': 273, 'title': '問題1 課題理解（1～5番）', 'items': q1},
        {'section': 2, 'type': 'select', 'audio': '3-43～3-48', 'qrPage': 273, 'title': '問題2 ポイント理解（1～6番）', 'items': q2},
        {'section': 3, 'type': 'kana', 'audio': '3-50～3-54', 'qrPage': 273, 'title': '問題3 概要理解（1～5番）', 'items': q3},
        {'section': 4, 'type': 'kana', 'audio': '3-56～3-67', 'qrPage': 273, 'title': '問題4 即時応答（1～12番）', 'items': q4},
        {'section': 5, 'type': 'kana', 'audio': '3-68～3-69', 'qrPage': 273, 'title': '問題5 統合理解（1番・2番）', 'items': q5a},
        {'section': 6, 'type': 'select', 'audio': '3-70', 'qrPage': 273, 'title': '問題5 統合理解（3番）', 'items': q5b},
    ],
}
with open(D + r'\questions.js', 'w', encoding='utf-8') as f:
    f.write('// 听解 Unit15 Part3 実践編 第2回 N2聴解模擬テスト · 题目板块\n// 音频：3-36～3-70（例 3-36/3-42/3-49/3-55 为演示，正式题从1番起）\n// 問題3/4/5的1・2番无印刷选项，选项在录音中；答案见作答后显示或正解一览\nexport default ' + json.dumps(questions, ensure_ascii=False, indent=1))

# ================= knowledge（模拟测试构成+正解一览） =================
def T(heading, head, rows):
    return {'heading': heading, 'audio': '', 'kind': 'table', 'intro': '',
            'head': head,
            'pairs': [{'c': '', 'l': l, 'le': le, 'r': r, 're': re, 'lFuri': '', 'leFuri': '', 'rFuri': '', 'reFuri': ''} for l, le, r, re in rows]}

knowledge = {
    'title': '第2回 N2聴解模擬テスト',
    'audio': '3-36～3-70',
    'qrPages': [273],
    'intro': '本回为全真模拟测试，题型、题量与正式考试完全一致：問題1課題理解（5题）→問題2ポイント理解（6题）→問題3概要理解（5题）→問題4即時応答（12题）→問題5統合理解（3题），共31题。听力音频请扫描上方二维码获取（3-36～3-70）。問題1、2选项印在试卷上；問題3、4及問題5的1・2番选项在录音中。',
    'parts': [
        T('1. 测试构成', ['問題', '题型', '题数', '音频'], [
            ('問題1', '課題理解', '5题', '3-37～3-41（例3-36）'),
            ('問題2', 'ポイント理解', '6题', '3-43～3-48（例3-42）'),
            ('問題3', '概要理解', '5题', '3-50～3-54（例3-49）'),
            ('問題4', '即時応答', '12题', '3-56～3-67（例3-55）'),
            ('問題5', '統合理解', '3题（3番含2问）', '3-68～3-70'),
        ]),
        T('2. 正解一览（第2回）', ['問題', '答案', '', ''], [
            ('問題1 課題理解', '1=4 2=3 3=2 4=2 5=1', '', ''),
            ('問題2 ポイント理解', '1=1 2=3 3=1 4=2 5=2 6=3', '', ''),
            ('問題3 概要理解', '1=2 2=1 3=2 4=4 5=3', '', ''),
            ('問題4 即時応答', '1=2 2=3 3=1 4=2 5=1 6=3 7=1 8=1 9=2 10=1 11=1 12=2', '', ''),
            ('問題5 統合理解', '1番=3 2番=2 3番（質問1=1 質問2=4）', '', ''),
        ]),
    ],
}
with open(D + r'\knowledge.js', 'w', encoding='utf-8') as f:
    f.write('// 听解 Unit15 Part3 実践編 第2回 N2聴解模擬テスト · 补充知识（构成与正解）\nexport default ' + json.dumps(knowledge, ensure_ascii=False, indent=1))

index = '''// 听解 Unit15 Part3 実践編 第2回 N2聴解模擬テスト
import words from './words.js'
import questions from './questions.js'
import knowledge from './knowledge.js'

export default {
  id: 15,
  theme: '実践編 第2回 模擬テスト',
  words,
  questions,
  knowledge,
}
'''
with open(D + r'\index.js', 'w', encoding='utf-8') as f:
    f.write(index)

print('q1:', len(q1), 'q2:', len(q2), 'q3:', len(q3), 'q4:', len(q4), 'q5a:', len(q5a), 'q5b:', len(q5b))
print('sections:', len(questions['sections']), 'items:', sum(len(s['items']) for s in questions['sections']))
