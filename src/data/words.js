// 样例词库（节选自《超值白金版·红宝书大全集 N1-N5文字词汇详解》）
// 说明：当前为样例数据，后续可按相同格式继续扩充
// 字段：id, level(等级), kanji(汉字，纯假名词为空串), kana(假名), pitch(音调数组，如[1]表示①，[0]表示⓪),
//       pos(词性), meaning(释义), examples(例句数组，每项{jp:日文, zh:中文})
export const words = [
  // ===== N4N5 =====
  { id: 1, level: 'N4N5', kanji: '海', kana: 'うみ', pitch: [1], pos: '名', meaning: '大海，海洋', examples: [{ jp: '海が広い。', zh: '大海很辽阔。' }, { jp: '夏は海で泳ぐ。', zh: '夏天在海里游泳。' }] },
  { id: 2, level: 'N4N5', kanji: '戦争', kana: 'せんそう', pitch: [0], pos: '名', meaning: '战争', examples: [{ jp: '戦争が起きる。', zh: '战争爆发。' }] },
  { id: 3, level: 'N4N5', kanji: '秘密', kana: 'ひみつ', pitch: [1], pos: '名・ナ形', meaning: '秘密', examples: [{ jp: '秘密を守る。', zh: '保守秘密。' }] },
  { id: 4, level: 'N4N5', kanji: '以前', kana: 'いぜん', pitch: [1], pos: '名', meaning: '以前，之前', examples: [{ jp: '以前は静かな町だった。', zh: '以前是个安静的小镇。' }, { jp: '明治時代以前', zh: '明治时代以前' }] },
  { id: 5, level: 'N4N5', kanji: '爽やか', kana: 'さわやか', pitch: [2], pos: 'ナ形', meaning: '清爽，爽朗，爽快', examples: [{ jp: '爽やかな笑顔', zh: '爽朗的笑容' }, { jp: '天気が爽やかだ。', zh: '天气很清爽。' }] },
  { id: 6, level: 'N4N5', kanji: '取る', kana: 'とる', pitch: [1], pos: '他動1', meaning: '拿，取得，获得；订', examples: [{ jp: 'いい成績を取る。', zh: '取得好成绩。' }, { jp: '雑誌を取る。', zh: '订阅杂志。' }] },
  { id: 7, level: 'N4N5', kanji: '塗る', kana: 'ぬる', pitch: [0], pos: '他動1', meaning: '涂，涂抹', examples: [{ jp: '壁にペンキを塗る。', zh: '往墙上刷油漆。' }, { jp: '顔にクリームを塗る。', zh: '往脸上抹乳霜。' }] },
  { id: 8, level: 'N4N5', kanji: '入院', kana: 'にゅういん', pitch: [0], pos: '名・自動3', meaning: '住院', examples: [{ jp: '病気で入院する。', zh: '因病住院。' }] },
  { id: 9, level: 'N4N5', kanji: '社会', kana: 'しゃかい', pitch: [1], pos: '名', meaning: '社会', examples: [{ jp: '社会に出る。', zh: '踏入社会。' }, { jp: '上流社会', zh: '上流社会' }] },
  { id: 10, level: 'N4N5', kanji: '淡い', kana: 'あわい', pitch: [2], pos: 'イ形', meaning: '浅的，淡的', examples: [{ jp: '淡い色', zh: '浅颜色' }, { jp: '味が淡い。', zh: '味道淡。' }] },
  { id: 11, level: 'N4N5', kanji: '尋ねる', kana: 'たずねる', pitch: [3], pos: '他動2', meaning: '打听，询问；探索，查明', examples: [{ jp: '駅の係員に道を尋ねる。', zh: '向车站的工作人员问路。' }] },
  { id: 12, level: 'N4N5', kanji: '慣れる', kana: 'なれる', pitch: [2], pos: '自動2', meaning: '习惯，适应；熟悉，熟练', examples: [{ jp: '新しい生活に慣れた。', zh: '习惯了新生活。' }, { jp: '仕事に慣れる。', zh: '熟悉工作。' }] },
  { id: 13, level: 'N4N5', kanji: '新鮮', kana: 'しんせん', pitch: [1], pos: '名・ナ形', meaning: '新鲜，鲜活', examples: [{ jp: '新鮮な野菜', zh: '新鲜的蔬菜' }, { jp: '山の中の空気が新鮮だ。', zh: '山里的空气很新鲜。' }] },
  { id: 14, level: 'N4N5', kanji: '午後', kana: 'ごご', pitch: [1], pos: '名', meaning: '下午，午后', examples: [{ jp: '午後の会議', zh: '下午的会议' }] },
  { id: 15, level: 'N4N5', kanji: 'ありがとう', kana: 'ありがとう', pitch: [2], pos: '感', meaning: '谢谢', examples: [{ jp: '助けてくれてありがとう。', zh: '谢谢你帮我。' }] },
  { id: 16, level: 'N4N5', kanji: 'ゆっくり', kana: 'ゆっくり', pitch: [3], pos: '副', meaning: '慢慢地，从容地；好好地', examples: [{ jp: 'ゆっくり休んでください。', zh: '请好好休息。' }, { jp: 'ゆっくり話す。', zh: '慢慢说。' }] },
  { id: 17, level: 'N4N5', kanji: 'しっかり', kana: 'しっかり', pitch: [3], pos: '副', meaning: '好好地，扎实地；结实', examples: [{ jp: 'しっかり勉強する。', zh: '认真学习。' }] },
  { id: 18, level: 'N4N5', kanji: 'もちろん', kana: 'もちろん', pitch: [2], pos: '副', meaning: '当然，不用说', examples: [{ jp: 'もちろん行きます。', zh: '当然会去。' }] },

  // ===== N3 =====
  { id: 19, level: 'N3', kanji: '避ける', kana: 'さける', pitch: [2], pos: '他動2', meaning: '避开，躲避，逃避', examples: [{ jp: '人目を避ける。', zh: '避人耳目。' }, { jp: '責任を避ける。', zh: '逃避责任。' }] },
  { id: 20, level: 'N3', kanji: '名字', kana: 'みょうじ', pitch: [1], pos: '名', meaning: '姓', examples: [{ jp: '結婚して名字が変わった。', zh: '结婚后改了姓。' }] },
  { id: 21, level: 'N3', kanji: '取り消す', kana: 'とりけす', pitch: [3], pos: '他動1', meaning: '取消，作废', examples: [{ jp: '注文を取り消す。', zh: '取消订货。' }, { jp: '免許を取り消す。', zh: '吊销执照。' }] },
  { id: 22, level: 'N3', kanji: '一応', kana: 'いちおう', pitch: [0], pos: '副', meaning: '姑且，暂且；大致', examples: [{ jp: '一応調べてみた。', zh: '大致查了一下。' }] },
  { id: 23, level: 'N3', kanji: '伝統', kana: 'でんとう', pitch: [0], pos: '名', meaning: '传统', examples: [{ jp: '伝統を守る。', zh: '遵守传统。' }] },
  { id: 24, level: 'N3', kanji: '待ち合わせ', kana: 'まちあわせ', pitch: [0], pos: '名', meaning: '(在约定场所)等待会面', examples: [{ jp: '駅で待ち合わせをする。', zh: '在车站会合。' }, { jp: '待ち合わせの場所', zh: '约好的地方' }] },
  { id: 25, level: 'N3', kanji: '役所', kana: 'やくしょ', pitch: [3], pos: '名', meaning: '官署，政府机关', examples: [{ jp: '役所仕事', zh: '机关作风' }] },
  { id: 26, level: 'N3', kanji: '同時', kana: 'どうじ', pitch: [0], pos: '名', meaning: '同时，同时代', examples: [{ jp: '同時に起きる。', zh: '同时发生。' }] },
  { id: 27, level: 'N3', kanji: '揉む', kana: 'もむ', pitch: [1], pos: '他動1', meaning: '揉，捏，按摩', examples: [{ jp: '肩を揉む。', zh: '按摩肩膀。' }] },
  { id: 28, level: 'N3', kanji: '発つ', kana: 'たつ', pitch: [1], pos: '自動1', meaning: '离开，出发', examples: [{ jp: '日本を発つ。', zh: '离开日本。' }, { jp: '旅に発つ。', zh: '出去旅行。' }] },
  { id: 29, level: 'N3', kanji: '納得', kana: 'なっとく', pitch: [0], pos: '名・自他動3', meaning: '理解，领会；同意，信服', examples: [{ jp: '相手が納得するまで説明する。', zh: '解释到对方完全理解为止。' }] },
  { id: 30, level: 'N3', kanji: '掬う', kana: 'すくう', pitch: [0], pos: '他動1', meaning: '捧，舀', examples: [{ jp: '水を掬う。', zh: '舀水。' }] },
  { id: 31, level: 'N3', kanji: '燃やす', kana: 'もやす', pitch: [0], pos: '他動1', meaning: '烧，燃烧；激发', examples: [{ jp: '蝋燭を燃やす。', zh: '点燃蜡烛。' }, { jp: '情熱を燃やす。', zh: '充满热情。' }] },
  { id: 32, level: 'N3', kanji: '余裕', kana: 'よゆう', pitch: [0], pos: '名', meaning: '从容；充裕', examples: [{ jp: '余裕のある態度', zh: '从容不迫的态度' }] },
  { id: 33, level: 'N3', kanji: '支える', kana: 'ささえる', pitch: [3], pos: '他動2', meaning: '支撑；维持', examples: [{ jp: '父の収入で生活を支える。', zh: '依靠父亲的收入维持生活。' }] },
  { id: 34, level: 'N3', kanji: '方々', kana: 'ほうぼう', pitch: [1], pos: '名', meaning: '到处，各处', examples: [{ jp: '方々に迷惑をかける。', zh: '到处添麻烦。' }] },

  // ===== N2 =====
  { id: 35, level: 'N2', kanji: '恵み', kana: 'めぐみ', pitch: [0], pos: '名', meaning: '恩惠', examples: [{ jp: '恵みを乞う。', zh: '祈求恩赐。' }] },
  { id: 36, level: 'N2', kanji: '申し分', kana: 'もうしぶん', pitch: [2], pos: '名', meaning: '可挑剔的地方；意见', examples: [{ jp: '申し分のないできばえだ。', zh: '做得无可挑剔。' }] },
  { id: 37, level: 'N2', kanji: '童謡', kana: 'どうよう', pitch: [0], pos: '名', meaning: '童谣，儿歌', examples: [{ jp: '童謡を歌って子どもを寝かせる。', zh: '哼唱儿歌哄孩子入睡。' }] },
  { id: 38, level: 'N2', kanji: '乱す', kana: 'みだす', pitch: [2], pos: '他動1', meaning: '弄乱；扰乱；蛊惑', examples: [{ jp: '秩序を乱す。', zh: '扰乱秩序。' }, { jp: '心を乱す。', zh: '蛊惑人心。' }] },
  { id: 39, level: 'N2', kanji: '判決', kana: 'はんけつ', pitch: [0], pos: '名・他動3', meaning: '判决', examples: [{ jp: '判決を言い渡す。', zh: '宣判。' }] },
  { id: 40, level: 'N2', kanji: '上下', kana: 'じょうげ', pitch: [1], pos: '名・自他動3', meaning: '上和下；上下级；上下移动', examples: [{ jp: '上下関係', zh: '上下级关系' }] },
  { id: 41, level: 'N2', kanji: '案', kana: 'あん', pitch: [1], pos: '名', meaning: '想法，主意；方案', examples: [{ jp: 'いい案を思いつく。', zh: '想出一个好点子。' }] },
  { id: 42, level: 'N2', kanji: '試作品', kana: 'しさくひん', pitch: [1], pos: '名', meaning: '试制品', examples: [{ jp: '試作品を作る。', zh: '制作试制品。' }] },
  { id: 43, level: 'N2', kanji: '盲点', kana: 'もうてん', pitch: [1], pos: '名', meaning: '盲点，漏洞', examples: [{ jp: '法の盲点をつく。', zh: '钻法律的空子。' }] },
  { id: 44, level: 'N2', kanji: '勝る', kana: 'まさる', pitch: [2], pos: '自動1', meaning: '胜过，优于', examples: [{ jp: '実力は彼に勝る。', zh: '实力胜过他。' }] },
  { id: 45, level: 'N2', kanji: '手触り', kana: 'てざわり', pitch: [2], pos: '名', meaning: '手感，触感', examples: [{ jp: '柔らかい手触り', zh: '柔软的手感' }] },
  { id: 46, level: 'N2', kanji: '賛成', kana: 'さんせい', pitch: [0], pos: '名・自動3', meaning: '赞成，同意', examples: [{ jp: '提案に賛成する。', zh: '赞同提案。' }] },
  { id: 47, level: 'N2', kanji: '見込む', kana: 'みこむ', pitch: [1], pos: '他動1', meaning: '预料，估计；认为有希望', examples: [{ jp: 'その企業の成長を見込んで投資する。', zh: '预计那家企业的发展而进行投资。' }] },
  { id: 48, level: 'N2', kanji: '工夫', kana: 'くふう', pitch: [0], pos: '名・他動3', meaning: '窍门，方法；考虑', examples: [{ jp: '工夫をこらす。', zh: '想方设法。' }] },
  { id: 49, level: 'N2', kanji: '残酷', kana: 'ざんこく', pitch: [1], pos: '名・ナ形', meaning: '残忍，残酷', examples: [{ jp: '残酷を極める。', zh: '残忍至极。' }] },

  // ===== N1 =====
  { id: 50, level: 'N1', kanji: '今更', kana: 'いまさら', pitch: [1], pos: '副', meaning: '事到如今', examples: [{ jp: '今更悔やんでもしかたがない。', zh: '事已至此，后悔也没用。' }] },
  { id: 51, level: 'N1', kanji: '質素', kana: 'しっそ', pitch: [1], pos: '名・ナ形', meaning: '俭朴，朴素', examples: [{ jp: '質素な身なり', zh: '朴素的打扮' }] },
  { id: 52, level: 'N1', kanji: '痛切', kana: 'つうせつ', pitch: [1], pos: '名・ナ形', meaning: '痛切，深切', examples: [{ jp: '痛切に感じる。', zh: '深切感到。' }] },
  { id: 53, level: 'N1', kanji: '閲覧', kana: 'えつらん', pitch: [0], pos: '名・他動3', meaning: '阅览', examples: [{ jp: '図書館で参考書を閲覧する。', zh: '在图书馆阅览参考书。' }] },
  { id: 54, level: 'N1', kanji: '社交', kana: 'しゃこう', pitch: [1], pos: '名', meaning: '社交，交际', examples: [{ jp: '社交の場', zh: '社交场合' }] },
  { id: 55, level: 'N1', kanji: '出向く', kana: 'でむく', pitch: [2], pos: '自動1', meaning: '前往，亲自去', examples: [{ jp: '現場に出向く。', zh: '前往现场。' }] },
  { id: 56, level: 'N1', kanji: '会見', kana: 'かいけん', pitch: [0], pos: '名・自動3', meaning: '会见', examples: [{ jp: '記者会見', zh: '记者招待会' }] },
  { id: 57, level: 'N1', kanji: '業者', kana: 'ぎょうしゃ', pitch: [1], pos: '名', meaning: '工商业者；同行，同业者', examples: [{ jp: '業者に頼む。', zh: '拜托专业公司。' }] },
  { id: 58, level: 'N1', kanji: '不信感', kana: 'ふしんかん', pitch: [2], pos: '名', meaning: '不信任感', examples: [{ jp: '不信感が募る。', zh: '不信任的感觉越来越强烈。' }] },
  { id: 59, level: 'N1', kanji: '議決', kana: 'ぎけつ', pitch: [0], pos: '名・他動3', meaning: '议决，表决', examples: [{ jp: '議決された。', zh: '被表决通过。' }] },
  { id: 60, level: 'N1', kanji: '情け深い', kana: 'なさけぶかい', pitch: [5], pos: 'イ形', meaning: '仁慈，富于同情心', examples: [{ jp: '情け深い神', zh: '仁慈的上帝' }] },
  { id: 61, level: 'N1', kanji: '斡旋', kana: 'あっせん', pitch: [0], pos: '名・他動3', meaning: '介绍，斡旋', examples: [{ jp: '仕事を斡旋してもらう。', zh: '托人找工作。' }] },
  { id: 62, level: 'N1', kanji: '捗る', kana: 'はかどる', pitch: [3], pos: '自動1', meaning: '进展顺利', examples: [{ jp: '仕事が捗る。', zh: '工作进展顺利。' }] },
  { id: 63, level: 'N1', kanji: '異議', kana: 'いぎ', pitch: [1], pos: '名', meaning: '异议', examples: [{ jp: '異議を唱える。', zh: '提出异议。' }] },
  { id: 64, level: 'N1', kanji: '孤独', kana: 'ことく', pitch: [1], pos: '名・ナ形', meaning: '孤独', examples: [{ jp: '孤独感をしみじみと味わう。', zh: '深深地体会到孤独的感觉。' }] },
  { id: 65, level: 'N1', kanji: '顕著', kana: 'けんちょ', pitch: [1], pos: '名・ナ形', meaning: '显著，明显', examples: [{ jp: '進歩が顕著だ。', zh: '进步显著。' }] },
]

// 音调数字转圈号显示
export function pitchToCircle(n) {
  const map = { 0: '⓪', 1: '①', 2: '②', 3: '③', 4: '④', 5: '⑤', 6: '⑥', 7: '⑦', 8: '⑧', 9: '⑨', 10: '⑩' }
  return map[n] || String(n)
}

// 等级列表
export const levels = [
  { id: 'N4N5', name: 'N4·N5', desc: '入门 · 基础' },
  { id: 'N3', name: 'N3', desc: '中级' },
  { id: 'N2', name: 'N2', desc: '中高级' },
  { id: 'N1', name: 'N1', desc: '高级' },
]

export function wordsByLevel(level) {
  return words.filter(w => w.level === level)
}
