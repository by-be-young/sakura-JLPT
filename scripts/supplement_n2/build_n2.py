# -*- coding: utf-8 -*-
"""生成 src/data/supplement-n2.js（N2 补充题库 · 全真模拟题1）

数据来源：夸克扫描件《新日本语能力考试考前冲刺 N2 全真模拟题（解析版）》全真模拟题1。
扫描件只含题面（无答案页），答案与解析由站内逐题补全；听力部分因无音频未收录。
"""
import json
from pathlib import Path

PARTS = {
    1: ("問題1 漢字読み", "文字"),
    2: ("問題2 表記", "文字"),
    3: ("問題3 文脈規定", "語彙"),
    4: ("問題4 言い換え類義", "語彙"),
    5: ("問題5 類義表現", "語彙"),
    6: ("問題6 用法", "語彙"),
    7: ("問題7 文法形式", "文法"),
    8: ("問題8 並べ替え", "文法"),
    9: ("問題9 文章の文法", "文法"),
    10: ("問題10 内容理解（短文）", "読解"),
    11: ("問題11 内容理解（中文）", "読解"),
    12: ("問題12 総合理解", "読解"),
    13: ("問題13 長文", "読解"),
    14: ("問題14 情報検索", "読解"),
}

# ---------------- 問題1〜6 文字・語彙 ----------------
VOCAB = [
    # 問題1 漢字読み
    dict(no=1, part=1, sentence="彼女の<u>望み</u>は何なのだろうか。",
         options=["なやみ", "このみ", "たのみ", "のぞみ"], answer=4,
         translation="她的愿望究竟是什么呢。",
         explanation="「望み」读作「のぞみ」，表示愿望；「悩み（なやみ）」是烦恼。"),
    dict(no=2, part=1, sentence="家族を<u>伴って</u>、アメリカに転勤することになった。",
         options=["ととのって", "ともなって", "したがって", "とどまって"], answer=2,
         translation="我决定带着家人调职去美国。",
         explanation="「伴う」读作「ともなう」，此处「伴って」＝「ともなって」，意为“带着、伴随”。"),
    dict(no=3, part=1, sentence="結婚したところはとても<u>貧しかった</u>。",
         options=["まずしかった", "さびしかった", "きびしかった", "かなしかった"], answer=1,
         translation="刚结婚的时候非常贫穷。",
         explanation="「貧しい」读作「まずしい」；「寂しい（さびしい）」「厳しい（きびしい）」「悲しい（かなしい）」均为干扰项。"),
    dict(no=4, part=1, sentence="こんな大きなダイヤモンドは見たこともないから、値段の<u>見当</u>がつかない。",
         options=["みとう", "みどう", "けんとう", "けんどう"], answer=3,
         translation="从没见过这么大的钻石，估不出价格。",
         explanation="「見当」读作「けんとう」，意为估计、推测；「見当がつかない」＝估摸不出来。"),
    dict(no=5, part=1, sentence="今年も昨年と<u>同様</u>、雪が少ない。",
         options=["どよう", "どうよ", "どうよう", "とうよう"], answer=3,
         translation="今年和去年一样，雪很少。",
         explanation="「同様」读作「どうよう」，意为“同样、一样”。"),

    # 問題2 表記
    dict(no=6, part=2, sentence="室内に干していた洗濯物から<u>すいてき</u>が落ちて、床が湿ってしまった。",
         options=["水適", "水滴", "水摘", "水敵"], answer=2,
         translation="室内晾着的衣服滴下水滴，地板湿了。",
         explanation="「すいてき」写作「水滴」，指水珠、水滴。"),
    dict(no=7, part=2, sentence="その<u>しらが</u>まじりの技師は電気製品を直す名人と呼ばれている。",
         options=["白鬚", "白髭", "白髯", "白髪"], answer=4,
         translation="那位夹杂着白发的技师被称为修理电器的名人。",
         explanation="「しらが」写作「白髪」，指白发；「鬚」「髭」「髯」都指胡须。"),
    dict(no=8, part=2, sentence="彼はいつも<u>むじ</u>の白いシャツを着て、さっぱりした格好をしている。",
         options=["無地", "無示", "無字", "無持"], answer=1,
         translation="他总穿着纯白的衬衫，打扮得很清爽。",
         explanation="「むじ」写作「無地」，指没有花纹的素色布料。"),
    dict(no=9, part=2, sentence="<u>みんかん</u>の鉄道会社は事故を防ぐため、車輪の規格を強化した。",
         options=["民関", "民間", "民管", "民官"], answer=2,
         translation="民营铁路公司为防止事故，强化了车轮的规格。",
         explanation="「みんかん」写作「民間」，指民间的、私营的；「官」与「民」相对。"),
    dict(no=10, part=2, sentence="<u>ぎょうれつ</u>に並ぶのはめんどうだが、規律を守るためには仕方がない。",
         options=["行例", "行冽", "行烈", "行列"], answer=4,
         translation="排队很麻烦，但为了遵守纪律也没办法。",
         explanation="「ぎょうれつ」写作「行列」，指队列、排成的行列。"),

    # 問題3 文脈規定（11〜15）
    dict(no=11, part=3, sentence="難しいと思っていたが、（　）にも合格できた。",
         options=["運", "幸運", "幸福", "運命"], answer=2,
         translation="原以为很难，没想到侥幸合格了。",
         explanation="「幸運にも」是固定搭配，意为“幸运的是”；「運」「運命」不能与「にも」这样搭配。"),
    dict(no=12, part=3, sentence="銀行の借金が返せず、会社は（　）してしまった。",
         options=["赤字", "困難", "故障", "破産"], answer=4,
         translation="还不上银行贷款，公司破产了。",
         explanation="「破産する」指破产，与“还不上借款”的语境相符。"),
    dict(no=13, part=3, sentence="そんな（　）な言葉を使うものではない。",
         options=["品", "下品", "悪い", "汚い"], answer=2,
         translation="不该说那么下流的话。",
         explanation="「下品な言葉」＝粗俗下流的话；「品」是名词，不能直接加「な」。"),
    dict(no=14, part=3, sentence="物だけではなく、心の（　）も大切だ。",
         options=["仲", "交際", "交流", "関係"], answer=3,
         translation="不只是物质，心灵的交流也很重要。",
         explanation="「心の交流」是固定说法，指心灵上的沟通；「仲」「交際」多指人际往来。"),
    dict(no=15, part=3, sentence="（　）で走ったので、しばらく動かなかった。",
         options=["人力", "体力", "実力", "全力"], answer=4,
         translation="因为全力奔跑，好一会儿动弹不得。",
         explanation="「全力で走る」＝用尽全力跑；「体力」「実力」不能直接接「で走る」。"),

    # 問題4 言い換え類義（16〜22）
    dict(no=16, part=4, sentence="応援していたチームが負けてしまい、（　）思いをした。",
         options=["くやしい", "けわしい", "はげしい", "まずしい"], answer=1,
         translation="支持的球队输了，心里很不甘心。",
         explanation="「くやしい思い」＝不甘心的感受；「けわしい」陡峭/严峻，「はげしい」激烈，「まずしい」贫穷。"),
    dict(no=17, part=4, sentence="富士山の山頂からは目が（　）ような美しい景色を見ることができる。",
         options=["おきる", "ひかる", "すわる", "さめる"], answer=4,
         translation="从富士山顶可以看到令人眼前一亮的美景。",
         explanation="「目がさめるような」＝令人耳目一新、惊艳的；是固定表达。"),
    dict(no=18, part=4, sentence="店長は仕事が終わると店の（　）を閉めてから帰る。",
         options=["クーラー", "シャッター", "スタンド", "テーブル"], answer=2,
         translation="店长下班后关上店里的卷帘门才回家。",
         explanation="「シャッターを閉める」＝拉下卷帘门；商店关门常用「シャッター」。"),
    dict(no=19, part=4, sentence="彼は休んだ（　）をなかなか話そうとしない。",
         options=["事情", "内容", "約束", "用事"], answer=1,
         translation="他迟迟不愿说出请假的原因。",
         explanation="「休んだ事情」＝请假的原委；「用事」指事情本身，不能表示“原因、缘由”。"),
    dict(no=20, part=4, sentence="同じ部屋で寝ている弟が起きないように、（　）ドアをかけた。",
         options=["うっかり", "すっきり", "こっそり", "はっきり"], answer=3,
         translation="为了不吵醒同屋睡的弟弟，悄悄地把门关上了。",
         explanation="「こっそり」＝悄悄地、不声不响地；「うっかり」不留神，「すっきり」清爽，「はっきり」清楚。"),
    dict(no=21, part=4, sentence="もうすぐ今年も終わりますね。（　）お正月は故郷へ帰るんですか。",
         options=["まず", "もう", "ところが", "ところで"], answer=4,
         translation="今年马上就要结束了。对了，过年你回老家吗？",
         explanation="「ところで」用于转换话题；「ところが」表转折，不合语境。"),
    dict(no=22, part=4, sentence="経済的に豊かな暮らしをしていても、心は（　）人もいる。",
         options=["おしい", "まずしい", "くだらない", "つまらない"], answer=2,
         translation="也有人物质生活富裕，内心却很贫乏。",
         explanation="「心がまずしい」＝精神贫乏；「おしい」可惜，「くだらない」「つまらない」指无聊。"),

    # 問題5 類義表現（23〜27）
    dict(no=23, part=5, sentence="西洋史のレポートを<u>苦心</u>して書き上げた。",
         options=["くろう", "なやみ", "つかれ", "ストレス"], answer=1,
         translation="费尽心血写完了西洋史的读书报告。",
         explanation="「苦心」＝「くろう（苦労）」，指费苦心、辛苦。"),
    dict(no=24, part=5, sentence="S大学の入試<u>制度</u>が来年から変わるそうだ。",
         options=["法", "方法", "原理", "決まり"], answer=4,
         translation="听说S大学的入学考试制度从明年起要变。",
         explanation="此处的「制度」指既定的规则、规定，与「決まり」最接近。"),
    dict(no=25, part=5, sentence="すみません。この<u>あたり</u>に銀行はありませんか。",
         options=["へん", "ところ", "となり", "ぜんご"], answer=1,
         translation="不好意思，这附近有银行吗？",
         explanation="「あたり」＝「へん（辺）」，指附近一带；「となり」是旁边，「ぜんご」是前后。"),
    dict(no=26, part=5, sentence="10月も中旬がすぎて、秋の<u>色</u>が深まった。",
         options=["気分", "傾向", "様子", "雰囲気"], answer=3,
         translation="十月已过中旬，秋意更浓了。",
         explanation="「秋の色」中的「色」指景色、景象的样子，与「様子」最接近；「雰囲気」侧重笼罩四周的气氛。"),
    dict(no=27, part=5, sentence="今日は午後から天気が<u>くずれる</u>そうだ。",
         options=["晴れ", "雨", "雲", "風"], answer=2,
         translation="听说今天下午天气要变坏。",
         explanation="「天気がくずれる」＝天气转坏，通常指要下雨，故选「雨」。"),

    # 問題6 用法（28〜32）
    dict(no=28, part=6, sentence="<u>どっと</u>", options=[
        "中学生になる弟は身長がどっと伸びていると伸びている。",
        "料理はたくさん用意しましたから、どっと召し上がってください。",
        "朝の通勤電車はドアが開くとともに、人がどっと降りてくる。",
        "昨日の試験はあまり勉強しなかったせいか、どっと間違えた。"], answer=3,
         translation="（正解句）早晨的通勤电车车门一开，人们一下子涌下来。",
         explanation="「どっと」表示人或物一口气、大量地涌来；①应为「ぐんと」，②应为「どうぞ」，④应为「たくさん」。"),
    dict(no=29, part=6, sentence="<u>活躍</u>", options=[
        "彼は国を代表するサッカー選手となって、海外でも活躍している。",
        "祖母は今年で90歳になるが、まだ活躍で暮らしている。",
        "一人一人が地球環境を守るために、小さなことから活躍するべきだ。",
        "中学生は放課後にスポーツなど授業以外の活躍がある。"], answer=1,
         translation="（正解句）他成为代表国家的足球选手，在海外也很活跃。",
         explanation="「活躍する」指在某领域大显身手；②应为「元気で」，③应为「行動する」，④应为「活動」。"),
    dict(no=30, part=6, sentence="<u>行儀</u>", options=[
        "困った人がいたら誰でも助けるという彼女の行儀は立派なものだ。",
        "その生徒は教師や親が見ていない時に問題行儀をよくするらしい。",
        "目上の人に会ってもあいさつもしないなんて、行儀がない。",
        "子どもの頃、母から食事中に行儀が悪いとよくしかられたものだ。"], answer=4,
         translation="（正解句）小时候，母亲常因我吃饭时没规矩而训我。",
         explanation="「行儀が悪い」是固定搭配，指举止没规矩；①应为「行い」，②应为「問題行動」，③「行儀がない」不自然。"),
    dict(no=31, part=6, sentence="<u>かぶせる</u>", options=[
        "網棚から荷物が落ちそうだったので、きちんとかぶせておいた。",
        "その男は自分が失敗したにもかかわらず、責任を同僚にかぶせた。",
        "自分でつかったものはきちんと元の所にかぶせておいてください。",
        "私の犬は大切な宝を土の中にかぶせている。"], answer=2,
         translation="（正解句）那男人明明自己失败了，却把责任推给同事。",
         explanation="「責任をかぶせる」＝把责任推给别人；①应为「直して」，③应为「戻して」，④应为「埋めて」。"),
    dict(no=32, part=6, sentence="<u>勝手</u>", options=[
        "弟は旅行へ行っても勝手なことばかりして、みんなに迷惑をかける。",
        "試合は初めは負けていて結果がどうなるか心配だったが、結局勝手になった。",
        "自分自身の人生ですから、行動に責任を持って勝手に生きるべきだと思う。",
        "コーヒーは一杯100円です。どうぞ勝手にお飲みください。"], answer=1,
         translation="（正解句）弟弟就算去旅行也总自作主张，给大家添麻烦。",
         explanation="「勝手なこと」＝自作主张、任性的事；②应为「勝ち」，③「勝手に生きる」含贬义，④应为「ご自由に」。"),
]

# ---------------- 文法（33〜54） ----------------
GRAMMAR = [
    dict(no=33, part=7, sentence="病気になって（　）、健康の大切さがわかった。",
         options=["はじめて", "かけて", "たびに", "からには"], answer=1,
         translation="生病之后，才第一次明白健康的重要性。",
         explanation="「〜してはじめて」＝做了某事之后才……，强调经过某事才获得认识。"),
    dict(no=34, part=7, sentence="動物実験の結果（　）、新しい薬が開発されることになった。",
         options=["につれて", "をめぐって", "に先立ち", "に基づいて"], answer=4,
         translation="基于动物实验的结果，开发出了新药。",
         explanation="「〜に基づいて」＝以……为基础/依据。"),
    dict(no=35, part=7, sentence="留学先で初めて迎えた夜は、なんとさびしかった（　）。",
         options=["限りだ", "ことか", "だけだ", "ものだ"], answer=2,
         translation="在留学地度过的第一个夜晚，是多么寂寞啊。",
         explanation="「なんと〜ことか」＝多么……啊，与「なんと」呼应表感叹。"),
    dict(no=36, part=7, sentence="新しい社長は、リーダー（　）指導力が欠けている気がする。",
         options=["としての", "においでも", "に基づいた", "につけても"], answer=1,
         translation="感觉新社长作为领导者缺乏指导能力。",
         explanation="「〜としての＋名词」＝作为……的（身份/职责）。"),
    dict(no=37, part=7, sentence="やせようと思って食事の量をへらしすぎた（　）、体調を崩してしまった。",
         options=["わりに", "ばかりか", "ことには", "ところ"], answer=4,
         translation="想减肥而过度减少了饭量，结果把身体搞坏了。",
         explanation="「〜たところ（が）」＝做了某事，结果（出乎意料地）……。"),
    dict(no=38, part=7, sentence="感謝の気持ち（　）、両親にプレゼントを贈った。",
         options=["にともなって", "をこめて", "にそって", "にわたって"], answer=2,
         translation="怀着感谢之情，送给父母礼物。",
         explanation="「〜をこめて」＝倾注（感情），如「心をこめて」。"),
    dict(no=39, part=7, sentence="今朝の新聞（　）、アメリカの有名歌手が自殺したそうだ。",
         options=["によると", "にとって", "につけても", "にあたり"], answer=1,
         translation="据今早的报纸报道，美国一位著名歌手自杀了。",
         explanation="「〜によると」＝根据（消息来源），常与「そうだ」呼应。"),
    dict(no=40, part=7, sentence="あの店の店員は私の質問（　）、丁寧に説明してくれた。",
         options=["に対して", "に加えて", "の末に", "に際して"], answer=1,
         translation="那家店的店员对我的问题耐心地做了说明。",
         explanation="「〜に対して」＝针对……（对象）。"),
    dict(no=41, part=7, sentence="3泊4日の旅行なんだから、そんな小さいカバンでは入り（　）よ。",
         options=["がたい", "きれない", "ぬけない", "えない"], answer=2,
         translation="是三天四夜的旅行，这么小的包是装不下的。",
         explanation="「〜きれない」＝不能完全……；「入りきれない」装不下。"),
    dict(no=42, part=7, sentence="お客様のご要望（　）、ご自宅まで商品をお届けするサービスを行っています。",
         options=["によっても", "につれて", "にすれば", "に応じて"], answer=4,
         translation="我们提供根据客户要求送货上门的服务。",
         explanation="「〜に応じて」＝根据……（相应地）。"),
    dict(no=43, part=7, sentence="子どものころは（　）、よく親を心配させたものだ。",
         options=["病気がちで", "病気っぽくて", "病気だらけで", "病気気味で"], answer=1,
         translation="小时候经常生病，常常让父母担心。",
         explanation="「〜がち」＝容易、经常（多用于不好的事），「病気がち」体弱多病。"),
    dict(no=44, part=7, sentence="結果（　）、一生懸命頑張るという過程が大切だ。",
         options=["にこたえて", "はともかく", "のもとに", "にかけては"], answer=2,
         translation="结果暂且不论，拼命努力这个过程很重要。",
         explanation="「〜はともかく（として）」＝……暂且不谈，先不说。"),

    # 問題8 並べ替え
    dict(no=45, part=8, sentence="音楽関係の学校に行っている彼女は＿＿ ＿＿ ★ ＿＿ そうだ。",
         options=["自分で曲も作っている", "のみ", "ピアノが得意である", "ならず"], answer=4,
         translation="听说在音乐类学校上学的她不仅擅长钢琴，还自己作曲。",
         explanation="正确顺序：ピアノが得意である→のみ→ならず→自分で曲も作っている。★处为「ならず」。"),
    dict(no=46, part=8, sentence="どんな＿＿ ★ ＿＿ ＿＿ 反対だ。",
         options=["ことには", "にせよ", "理由がある", "子供を殴る"], answer=2,
         translation="不管有什么理由，我都反对打孩子。",
         explanation="正确顺序：理由がある→にせよ→子供を殴る→ことには。★处为「にせよ」。"),
    dict(no=47, part=8, sentence="あの人は＿＿ ＿＿ ★ ＿＿ 言うので、周りの人に嫌われている。",
         options=["何もやらない", "文句ばかり", "くせに", "自分では"], answer=3,
         translation="那人自己什么都不干，却净发牢骚，所以被周围人讨厌。",
         explanation="正确顺序：自分では→何もやらない→くせに→文句ばかり。★处为「くせに」。"),
    dict(no=48, part=8, sentence="テレビで放送されていたこと＿＿ ★ ＿＿ ＿＿ とはかぎらない。",
         options=["といって", "必ずしも", "だから", "正しい情報である"], answer=1,
         translation="虽说是在电视上播出的，也未必就是正确的信息。",
         explanation="正确顺序：だから→といって→必ずしも→正しい情報である。★处为「といって」（「〜だからといって」）。"),
    dict(no=49, part=8, sentence="どんなにお金があった＿＿ ＿＿ ★ ＿＿ とはいえないだろう。",
         options=["健康でない", "ことには", "としても", "幸せである"], answer=2,
         translation="就算有再多的钱，不健康的话也不能说幸福吧。",
         explanation="正确顺序：としても→健康でない→ことには→幸せである。★处为「ことには」。"),

    # 問題9 文章の文法
    dict(no=50, part=9, article="""発達障害の人は、現在では、大体50人から100人に一人ぐらいいると言われています。人とのコミュニケーションが苦手な面がありますが、決して育て方に問題が〔50〕。その子が持って生まれたものです。ただ、固定したものではなく、今後の関わり方〔51〕、その子なりに成長していくといわれています。

発達障害は、一言でいうと、「能力のでこぼこ」がある状態です。特異なものにはとても力を発揮する〔52〕、苦手なものは、かなり苦手です。特に人と関わるときに、苦手な面が目立つことが多いです。しかし逆に、〔53〕も多く、歴史上で有名な科学者や数学者の中には、今なら発達障害を診断される人が、結構いたのではないかといわれています。

苦手な面も、成長する〔54〕伸びていくものです。お子さんの様子を見て、「できること」と「できないこと」を見極め、わからないことは専門家に相談しながら考えていかれたらいいと思います。""",
         sentence="〔50〕に入る最もよいものはどれか。",
         options=["あったわけではありません", "あったにちがいありません", "ないはずはありません", "あるべきではありません"], answer=1,
         translation="文章谈的是发育障碍儿童：并非教养方式有问题，而是与生俱来；今后如何相处会让孩子以自己的方式成长。",
         explanation="前有「決して」，句末需用否定推测「〜わけではありません」＝并不是……。"),
    dict(no=51, part=9, article="（承上文，同問題9文章）",
         sentence="〔51〕に入る最もよいものはどれか。",
         options=["に関して", "に際して", "によって", "をきっかけに"], answer=3,
         translation="据说今后如何相处，会让孩子以自己的方式成长。",
         explanation="「〜によって」＝根据、取决于（此处指随相处方式而变化）。"),
    dict(no=52, part=9, article="（承上文，同問題9文章）",
         sentence="〔52〕に入る最もよいものはどれか。",
         options=["ところに", "ついでに", "ばかりか", "ものの"], answer=4,
         translation="在特别擅长的方面能发挥很强的能力，但不擅长的方面则相当弱。",
         explanation="「〜ものの」＝虽然……但是……，表转折。"),
    dict(no=53, part=9, article="（承上文，同問題9文章）",
         sentence="〔53〕に入る最もよいものはどれか。",
         options=["得意なことがない人", "能力を発揮する人", "コミュニケーションが苦手な人", "障害が目立つ人"], answer=2,
         translation="但反过来，能发挥能力的人也很多，历史上著名的科学家、数学家中……",
         explanation="「逆に」后面应接与前文“苦手”相对的正面内容，即「能力を発揮する人」。"),
    dict(no=54, part=9, article="（承上文，同問題9文章）",
         sentence="〔54〕に入る最もよいものはどれか。",
         options=["にそって", "につれて", "を通して", "に基づいて"], answer=2,
         translation="不擅长的方面也会随着成长而提高。",
         explanation="「〜につれて」＝随着……（逐渐变化）。"),
]

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from data_reading import READING  # noqa: E402

ALL = VOCAB + GRAMMAR + READING

PACK_DEFS = [
    ("n2-mock1-vocab-32", "N2 全真模拟题1 文字・語彙 32 题", "語彙",
     "题面取自扫描件「全真模拟题1」的语言知识部分（問題1〜6）。", list(range(1, 7))),
    ("n2-mock1-grammar-22", "N2 全真模拟题1 文法 22 题", "文法",
     "题面取自扫描件「全真模拟题1」的文法部分（問題7〜9）。", list(range(7, 10))),
    ("n2-mock1-reading-21", "N2 全真模拟题1 読解 21 题", "読解",
     "题面取自扫描件「全真模拟题1」的阅读部分（問題10〜14），短文、中文、长文与信息检索全收。", list(range(10, 15))),
]


def build_packs():
    packs = []
    for pid, title, ptype, note, part_nos in PACK_DEFS:
        parts = []
        for pno in part_nos:
            count = sum(1 for q in ALL if q["part"] == pno)
            parts.append({"no": pno, "name": PARTS[pno][0], "count": count})
        packs.append({
            "id": pid,
            "level": "N2",
            "title": title,
            "shortTitle": title.replace("N2 全真模拟题1 ", ""),
            "type": ptype,
            "origin": "external",
            "provider": "新日本语能力考试考前冲刺 N2 全真模拟题（解析版）",
            "providerNote": "全真模拟题1（语言知识・阅读）扫描件录入；" + note + "扫描件不含答案页，答案与解析由站内逐题校对补全，仅供练习参考。",
            "url": "",
            "count": sum(p["count"] for p in parts),
            "parts": parts,
        })
    return packs


def build_questions():
    pack_of_part = {}
    for pid, _, _, _, part_nos in PACK_DEFS:
        for pno in part_nos:
            pack_of_part[pno] = pid

    out = []
    carry_article = {}
    pack_seq = {}
    for idx, q in enumerate(sorted(ALL, key=lambda x: x["no"]), start=1):
        part = q["part"]
        pid = pack_of_part[part]
        pack_seq[pid] = pack_seq.get(pid, 0) + 1
        art = q.get("article", "")
        if art.startswith("（承上文"):
            art = carry_article.get(part, "")
        elif art:
            carry_article[part] = art
        out.append({
            "id": idx,
            "no": pack_seq[pid],
            "examNo": q["no"],
            "packId": pid,
            "level": "N2",
            "type": PARTS[part][1],
            "part": part,
            "partName": PARTS[part][0],
            "unit": 1,
            "sentence": q["sentence"],
            "sentenceFurigana": "",
            "options": q["options"],
            "answer": q["answer"],
            "translation": q["translation"],
            "explanation": q["explanation"],
            "article": art,
        })
    return out


def main():
    packs = build_packs()
    questions = build_questions()
    assert len(questions) == 75, len(questions)
    assert all(len(q["options"]) == 4 for q in questions)
    assert all(1 <= q["answer"] <= 4 for q in questions)
    nos = [q["examNo"] for q in questions]
    assert nos == list(range(1, 76)), nos
    for pid in {q["packId"] for q in questions}:
        local = [q["no"] for q in questions if q["packId"] == pid]
        assert local == list(range(1, len(local) + 1)), (pid, local)

    js = []
    js.append("// 补充题库 · N2（非红蓝宝书题库，独立数据模块，请勿并入 questions.js）")
    js.append("// 数据来源：《新日本语能力考试考前冲刺 N2 全真模拟题（解析版）》全真模拟题1（语言知识・阅读，75 题）。")
    js.append("// 扫描件不含答案页：答案、译文与解析由站内逐题校对补全；听力部分因无音频未收录。")
    js.append("// 由 scripts/supplement_n2/build_n2.py 生成，请勿手改。")
    js.append("")
    js.append("export const supplementPacks = " + json.dumps(packs, ensure_ascii=False, indent=2))
    js.append("")
    js.append("export const supplementN2Questions = " + json.dumps(questions, ensure_ascii=False, indent=2))
    js.append("")

    target = Path(__file__).resolve().parents[2] / "src" / "data" / "supplement-n2.js"
    target.write_text("\n".join(js), encoding="utf-8")
    print("written", target, len(questions), "questions", sum(p["count"] for p in packs), "total")


if __name__ == "__main__":
    main()
