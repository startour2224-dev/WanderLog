import { getLocales } from 'expo-localization';

const deviceLang = getLocales()[0]?.languageCode ?? 'en';
export const isJapanese = deviceLang === 'ja';

// 🇯🇵 日本の47都道府県 ➔ 英語変換辞書
const PREF_EN_MAP: Record<string, string> = {
  '東京都': 'Tokyo', '東京': 'Tokyo',
  '北海道': 'Hokkaido',
  '京都府': 'Kyoto', '京都': 'Kyoto',
  '大阪府': 'Osaka', '大阪': 'Osaka',
  '神奈川県': 'Kanagawa', '神奈川': 'Kanagawa',
  '埼玉県': 'Saitama', '埼玉': 'Saitama',
  '千葉県': 'Chiba', '千葉': 'Chiba',
  '愛知県': 'Aichi', '愛知': 'Aichi',
  '福岡県': 'Fukuoka', '福岡': 'Fukuoka',
  '兵庫県': 'Hyogo', '兵庫': 'Hyogo',
  '静岡県': 'Shizuoka', '静岡': 'Shizuoka',
  '広島県': 'Hiroshima', '広島': 'Hiroshima',
  '宮城県': 'Miyagi', '宮城': 'Miyagi',
  '沖縄県': 'Okinawa', '沖縄': 'Okinawa',
  '長野県': 'Nagano', '長野': 'Nagano',
  '新潟県': 'Niigata', '新潟': 'Niigata',
  '茨城県': 'Ibaraki', '茨城': 'Ibaraki',
  '栃木県': 'Tochigi', '栃木': 'Tochigi',
  '群馬県': 'Gunma', '群馬': 'Gunma',
  '岐阜県': 'Gifu', '岐阜': 'Gifu',
  '三重県': 'Mie', '三重': 'Mie',
  '滋賀県': 'Shiga', '滋賀': 'Shiga',
  '奈良県': 'Nara', '奈良': 'Nara',
  '和歌山県': 'Wakayama', '和歌山': 'Wakayama',
  '岡山県': 'Okayama', '岡山': 'Okayama',
  '山口県': 'Yamaguchi', '山口': 'Yamaguchi',
  '鳥取県': 'Tottori', '鳥取': 'Tottori',
  '島根県': 'Shimane', '島根': 'Shimane',
  '香川県': 'Kagawa', '香川': 'Kagawa',
  '徳島県': 'Tokushima', '徳島': 'Tokushima',
  '愛媛県': 'Ehime', '愛媛': 'Ehime',
  '高知県': 'Kochi', '高知': 'Kochi',
  '熊本県': 'Kumamoto', '熊本': 'Kumamoto',
  '大分県': 'Oita', '大分': 'Oita',
  '宮崎県': 'Miyazaki', '宮崎': 'Miyazaki',
  '鹿児島県': 'Kagoshima', '鹿児島': 'Kagoshima',
  '長崎県': 'Nagasaki', '長崎': 'Nagasaki',
  '佐賀県': 'Saga', '佐賀': 'Saga',
  '青森県': 'Aomori', '青森': 'Aomori',
  '岩手県': 'Iwate', '岩手': 'Iwate',
  '秋田県': 'Akita', '秋田': 'Akita',
  '山形県': 'Yamagata', '山形': 'Yamagata',
  '福島県': 'Fukushima', '福島': 'Fukushima',
  '山梨県': 'Yamanashi', '山梨': 'Yamanashi',
  '石川県': 'Ishikawa', '石川': 'Ishikawa',
  '富山県': 'Toyama', '富山': 'Toyama',
  '福井県': 'Fukui', '福井': 'Fukui',
};

// 🌐 国名 ➔ 英語変換辞書
const COUNTRY_EN_MAP: Record<string, string> = {
  '日本': 'Japan',
  'アメリカ合衆国': 'United States',
  'アメリカ': 'United States',
  'カナダ': 'Canada',
  'フランス': 'France',
  'イギリス': 'United Kingdom',
  '英国': 'United Kingdom',
  'ドイツ': 'Germany',
  'イタリア': 'Italy',
  'スペイン': 'Spain',
  'スイス': 'Switzerland',
  '韓国': 'South Korea',
  '台湾': 'Taiwan',
  '中国': 'China',
  'タイ': 'Thailand',
  'ベトナム': 'Vietnam',
  'シンガポール': 'Singapore',
  'インドネシア': 'Indonesia',
  'マレーシア': 'Malaysia',
  'フィリピン': 'Philippines',
  'オーストラリア': 'Australia',
  'ニュージーランド': 'New Zealand',
  'ブラジル': 'Brazil',
  'イラン': 'Iran',
  'パキスタン': 'Pakistan',
  'キルギス': 'Kyrgyzstan',
  'エジプト': 'Egypt',
  'ロシア': 'Russia',
};

// 🌟 保存された地名を、現在の言語設定（英語／日本語）に合わせて瞬時に変換する関数
export function formatLocationName(locationName?: string, country?: string): string {
  if (!isJapanese) {
    // 英語モード
    let c = country ? (COUNTRY_EN_MAP[country] || country) : '';
    let loc = locationName || '';
    
    // 日本の都道府県が含まれる場合、Tokyo, Osakaなどに変換
    for (const [jpPref, enPref] of Object.entries(PREF_EN_MAP)) {
      if (loc.includes(jpPref)) {
        const remainder = loc.replace(jpPref, '').trim();
        const cityClean = remainder ? remainder.replace(/区|市|町|村/g, '') : '';
        loc = cityClean ? `${cityClean}, ${enPref}` : enPref;
        break;
      }
    }

    // 海外主要都市の日本語表記も英語化
    loc = loc
      .replace(/パリ/g, 'Paris')
      .replace(/ロンドン/g, 'London')
      .replace(/ニューヨーク/g, 'New York')
      .replace(/ロサンゼルス/g, 'Los Angeles')
      .replace(/バンコク/g, 'Bangkok')
      .replace(/ソウル/g, 'Seoul')
      .replace(/台北/g, 'Taipei')
      .replace(/ローマ/g, 'Rome');

    if (c && loc && !loc.includes(c)) {
      return `${c} · ${loc}`;
    }
    return loc || c || 'Travel Spot';
  }

  // 日本語モード
  if (country && locationName && !locationName.includes(country)) {
    return `${country} · ${locationName}`;
  }
  return locationName || country || '記録地点';
}

export const t = {
  nav: {
    home: isJapanese ? 'ホーム' : 'Home',
    map: isJapanese ? '地図' : 'Map',
    memories: isJapanese ? '思い出' : 'Memories',
    analytics: isJapanese ? 'アナリティクス' : 'Analytics',
  },
  home: {
    yearsAgo: (y: number) => isJapanese ? `${y}年前の今日` : `${y} year${y > 1 ? 's' : ''} ago today`,
    today: isJapanese ? '今日の記憶' : 'Today\'s Memory',
    daysAgo: (d: number) => isJapanese ? `${d}日前の旅` : `${d} days ago`,
    shuffle: isJapanese ? '別の思い出' : 'Shuffle',
    ambientSound: isJapanese ? '現地のチルな音が流れています' : 'Playing ambient memory sound...',
    emptyTitle: 'WanderLog',
    emptySub: isJapanese ? 'まだ旅の軌跡が刻まれていません。\n地図を長押しして最初の瞬間を保存しましょう。' : 'No travel moments yet.\nLong-press on the map to log your first journey.',
  },
  map: {
    guide: isJapanese ? '📍 地図を長押しして思い出を記録' : '📍 Long-press map to log memory',
    vibeQuestion: isJapanese ? 'その瞬間の感情は？' : 'How does this moment feel?',
    photoOptional: isJapanese ? '写真（任意）' : 'Photo (Opt)',
    audioOptional: isJapanese ? '音声（任意）' : 'Audio (Opt)',
    recording: isJapanese ? 'タップで停止' : 'Tap to stop',
    recorded: isJapanese ? '録音完了' : 'Recorded',
    deleteAudio: isJapanese ? '音声を削除' : 'Delete audio',
    inputPlaceholder: isJapanese ? 'ここでの出来事は？' : 'What happened here?',
    save: isJapanese ? '保存' : 'Save',
    back: isJapanese ? '戻る' : 'Cancel',
    analyzing: isJapanese ? '地名を解析中...' : 'Analyzing location...',
    unknownSpot: isJapanese ? '未知のスポット' : 'Unknown Spot',
    titleRequired: isJapanese ? 'タイトルを入力してください' : 'Please enter a title',
    micPermission: isJapanese ? 'マイクの許可が必要です' : 'Microphone permission required',
  },
  memories: {
    headerSub: 'MEMORIES ARCHIVE',
    headerTitle: isJapanese ? '旅のコレクション' : 'Travel Archive',
    emptyText: isJapanese ? 'まだ思い出がありません。\n地図を長押しして刻みましょう！' : 'No memories yet.\nLong-press map to start your journey!',
    shareBtn: isJapanese ? 'シネマティックカードをシェア' : 'Share Cinematic Card',
    playAudio: isJapanese ? '現地の音を聴く' : 'Play Ambient Sound',
    playing: isJapanese ? '再生中...' : 'Playing...',
    deleteTitle: isJapanese ? '削除' : 'Delete',
    deleteConfirm: isJapanese ? 'この思い出を消しますか？' : 'Delete this memory?',
    cancel: isJapanese ? 'キャンセル' : 'Cancel',
    delete: isJapanese ? '削除' : 'Delete',
  },
  analytics: {
    headerSub: 'GLOBAL TRAVEL ANALYTICS',
    headerTitle: isJapanese ? '人生の旅の軌跡' : 'Journey Analytics',
    proTag: 'PRO EDITION',
    spots: isJapanese ? '訪問スポット' : 'Spots Logged',
    countries: isJapanese ? '訪問国数' : 'Countries',
    days: isJapanese ? '旅した日数' : 'Days Traveled',
    collectionTitle: isJapanese ? 'エリアコレクション図鑑' : 'Area Collection',
    collectionSub: isJapanese ? 'エリアを押すと思い出がまとめて表示されます' : 'Tap unlocked areas to view memories',
    unlockRate: (rate: number) => isJapanese ? `制覇率 ${rate}%` : `${rate}% Unlocked`,
    tapToView: isJapanese ? 'タップで見る' : 'Tap to view',
    completed: isJapanese ? '制覇完了 · 一覧を表示 ➔' : 'Unlocked · View All ➔',
    locked: isJapanese ? 'LOCKED' : 'LOCKED',
    unexplored: isJapanese ? '未踏の地' : 'Unexplored',
    vibeTitle: isJapanese ? '感情（Vibe）のバランス' : 'Vibe Distribution',
    vibeSub: isJapanese ? 'あなたが旅先で感じた感情の割合' : 'Emotional breakdown of your journeys',
    timelineTitle: isJapanese ? '訪問履歴タイムライン' : 'Visit History',
    timelineSub: isJapanese ? 'これまでに刻んだ旅の記録' : 'Chronological archive of your visits',
    emptyHistory: isJapanese ? 'まだ履歴がありません。地図からスポットを追加してみましょう！' : 'No visits logged yet. Drop a pin on the map!',
    areaModalSub: 'AREA COLLECTION',
    countLogged: (count: number) => isJapanese ? `${count} 箇所の思い出が記録されています` : `${count} spots recorded in this region`,
    hasAudio: isJapanese ? '音声あり' : 'Audio',
  },
};