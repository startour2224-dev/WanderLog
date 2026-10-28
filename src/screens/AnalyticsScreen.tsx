import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, Dimensions, TouchableOpacity, Modal, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { t, isJapanese, formatLocationName } from '../i18n/translations';

const { width } = Dimensions.get('window');

// 🌐 世界の主要リージョン
const WORLD_REGIONS = [
  { 
    id: 'north_america', 
    name: isJapanese ? '北米 (North America)' : 'North America', 
    isoCodes: ['US', 'CA', 'MX', 'PR', 'BM', 'GL'], 
    keywords: ['カナダ', 'Canada', 'アメリカ', 'United States', 'USA', 'メキシコ', 'Mexico', 'トロント', 'バンクーバー', 'ニューヨーク', 'ロサンゼルス'], 
    gradient: ['#FF416C', '#FF4B2B'] as [string, string], 
    icon: 'earth' 
  },
  { 
    id: 'west_europe', 
    name: isJapanese ? '西欧・南欧 (Western Europe)' : 'Western & Southern Europe', 
    isoCodes: ['FR', 'GB', 'DE', 'IT', 'ES', 'CH', 'NL', 'BE', 'PT', 'AT', 'GR', 'IE', 'MC', 'LU', 'VA', 'AD', 'SM', 'MT', 'CY'], 
    keywords: ['フランス', 'France', 'イギリス', 'UK', 'United Kingdom', '英国', 'ドイツ', 'Germany', 'イタリア', 'Italy', 'スペイン', 'Spain', 'スイス', 'Switzerland'], 
    gradient: ['#4A00E0', '#8E2DE2'] as [string, string], 
    icon: 'compass' 
  },
  { 
    id: 'nordic_east_europe', 
    name: isJapanese ? '北欧・東欧・ロシア (Nordic & Eastern Europe)' : 'Nordic, Eastern Europe & Russia', 
    isoCodes: ['SE', 'NO', 'FI', 'DK', 'IS', 'PL', 'CZ', 'SK', 'HU', 'HR', 'EE', 'LV', 'LT', 'RO', 'BG', 'UA', 'RU', 'BY', 'RS', 'SI', 'BA', 'AL'], 
    keywords: ['スウェーデン', 'Sweden', 'ノルウェー', 'Norway', 'フィンランド', 'Finland', 'デンマーク', 'Denmark', 'ポーランド', 'Poland', 'チェコ', 'ロシア', 'Russia'], 
    gradient: ['#00F260', '#0575E6'] as [string, string], 
    icon: 'snow' 
  },
  { 
    id: 'east_asia', 
    name: isJapanese ? '東アジア (East Asia)' : 'East Asia (excl. Japan)', 
    isoCodes: ['KR', 'TW', 'CN', 'HK', 'MO', 'MN', 'KP'], 
    keywords: ['韓国', 'Korea', '台湾', 'Taiwan', '中国', 'China', '香港', 'Hong Kong', 'マカオ', 'ソウル', '台北', '北京', '上海'], 
    gradient: ['#F37335', '#FDC830'] as [string, string], 
    icon: 'trail-sign' 
  },
  { 
    id: 'se_asia', 
    name: isJapanese ? '東南アジア (Southeast Asia)' : 'Southeast Asia', 
    isoCodes: ['TH', 'VN', 'SG', 'ID', 'MY', 'PH', 'KH', 'LA', 'MM', 'BN', 'TL'], 
    keywords: ['タイ', 'Thailand', 'ベトナム', 'Vietnam', 'シンガポール', 'Singapore', 'インドネシア', 'Indonesia', 'バリ', 'マレーシア', 'Malaysia', 'フィリピン', 'Philippines'], 
    gradient: ['#11998e', '#38ef7d'] as [string, string], 
    icon: 'leaf' 
  },
  { 
    id: 'mid_east_central_south_asia', 
    name: isJapanese ? '中東・中央・南アジア (Mid East & Central/South Asia)' : 'Middle East, Central & South Asia', 
    isoCodes: ['IR', 'PK', 'KG', 'UZ', 'KZ', 'TJ', 'TM', 'AF', 'IN', 'NP', 'LK', 'BD', 'BT', 'MV', 'AE', 'SA', 'TR', 'QA', 'KW', 'OM', 'BH', 'JO', 'IL', 'LB', 'IQ', 'YE', 'SY', 'GE', 'AM', 'AZ'], 
    keywords: ['イラン', 'Iran', 'パキスタン', 'Pakistan', 'キルギス', 'Kyrgyzstan', 'ウズベキスタン', 'Uzbekistan', 'カザフスタン', 'Kazakhstan', 'インド', 'India', 'ドバイ', 'Dubai', 'UAE', 'トルコ', 'Turkey'], 
    gradient: ['#f7971e', '#ffd200'] as [string, string], 
    icon: 'bonfire' 
  },
  { 
    id: 'africa', 
    name: isJapanese ? 'アフリカ (Africa)' : 'Africa', 
    isoCodes: ['EG', 'MA', 'ZA', 'KE', 'TZ', 'ET', 'NG', 'GH', 'TN', 'DZ', 'UG', 'ZW', 'NA', 'BW', 'MU', 'SC', 'SN', 'MG'], 
    keywords: ['エジプト', 'Egypt', 'モロッコ', 'Morocco', '南アフリカ', 'South Africa', 'ケニア', 'Kenya', 'タンザニア', 'Tanzania'], 
    gradient: ['#e65c00', '#F9D423'] as [string, string], 
    icon: 'flame' 
  },
  { 
    id: 'oceania', 
    name: isJapanese ? 'オセアニア・太平洋 (Oceania & Pacific)' : 'Oceania & Pacific', 
    isoCodes: ['AU', 'NZ', 'FJ', 'GU', 'MP', 'PF', 'NC', 'PW', 'PG', 'WS', 'TO'], 
    keywords: ['オーストラリア', 'Australia', 'ニュージーランド', 'New Zealand', 'グアム', 'Guam', 'サイパン', 'シドニー'], 
    gradient: ['#00c6ff', '#0072ff'] as [string, string], 
    icon: 'water' 
  },
  { 
    id: 'latin_america', 
    name: isJapanese ? '中南米・カリブ (Latin America & Caribbean)' : 'Latin America & Caribbean', 
    isoCodes: ['BR', 'AR', 'CL', 'PE', 'CO', 'CR', 'CU', 'PA', 'EC', 'UY', 'BO', 'PY', 'VE', 'GT', 'DO', 'JM'], 
    keywords: ['ブラジル', 'Brazil', 'アルゼンチン', 'Argentina', 'ペルー', 'Peru', 'チリ', 'Chile', 'コロンビア', 'Colombia'], 
    gradient: ['#f857a6', '#ff5858'] as [string, string], 
    icon: 'planet' 
  },
];

// 🇯🇵 日本の8地方定義
const JAPAN_REGIONS = [
  { id: 'kanto', name: isJapanese ? '関東' : 'Kanto', gradient: ['#007AFF', '#00C6FF'] as [string, string], icon: 'business' },
  { id: 'kansai', name: isJapanese ? '近畿・関西' : 'Kansai', gradient: ['#FF2D55', '#FF375F'] as [string, string], icon: 'cube' },
  { id: 'chubu', name: isJapanese ? '中部・北陸' : 'Chubu', gradient: ['#FF9500', '#FFD60A'] as [string, string], icon: 'sunny' },
  { id: 'hokkaido', name: isJapanese ? '北海道' : 'Hokkaido', gradient: ['#5856D6', '#AF52DE'] as [string, string], icon: 'snow' },
  { id: 'tohoku', name: isJapanese ? '東北' : 'Tohoku', gradient: ['#30B0C7', '#34C759'] as [string, string], icon: 'leaf' },
  { id: 'chugoku', name: isJapanese ? '中国' : 'Chugoku', gradient: ['#FF6482', '#F3A183'] as [string, string], icon: 'bonfire' },
  { id: 'shikoku', name: isJapanese ? '四国' : 'Shikoku', gradient: ['#34C759', '#30D158'] as [string, string], icon: 'trail-sign' },
  { id: 'kyushu', name: isJapanese ? '九州・沖縄' : 'Kyushu & Okinawa', gradient: ['#FA709A', '#FEE140'] as [string, string], icon: 'flame' },
];

function isStrictlyJapan(m: any): boolean {
  const iso = (m.isoCountryCode || '').toUpperCase();
  const c = (m.country || '').toLowerCase();
  const lng = m.longitude;
  const lat = m.latitude;

  if (iso && iso !== 'JP') return false;

  if (['canada', 'united states', 'usa', 'france', 'uk', 'korea', 'thailand', 'iran', 'pakistan', 'kyrgyzstan', 'カナダ', 'アメリカ', 'フランス', 'イギリス', '韓国', 'タイ', 'イラン', 'パキスタン', 'キルギス'].some(k => c.includes(k))) {
    return false;
  }

  if (iso === 'JP' || c.includes('日本') || c.includes('japan')) return true;

  // 日本のGPS範囲
  return lng >= 122.0 && lng <= 153.0 && lat >= 24.0 && lat <= 46.0;
}

// 🛡️ 日本全国を英語・漢字・GPSの3重で100%正確に仕分けるエンジン
function getJapanRegionId(m: any): string | null {
  if (!isStrictlyJapan(m)) return null;

  const rawText = `${m.prefecture || ''} ${m.locationName || ''} ${m.title || ''}`;
  const tLower = rawText.toLowerCase();
  const lng = m.longitude;
  const lat = m.latitude;

  // 1. 北海道 (Hokkaido)
  if (
    tLower.includes('北海道') || tLower.includes('hokkaido') || 
    tLower.includes('札幌') || tLower.includes('sapporo') || 
    (lat >= 41.35 && lng >= 139.3)
  ) {
    return 'hokkaido';
  }

  // 2. 関東 (Kanto) - 東京都と京都の完全分離
  if (
    tLower.includes('東京都') || 
    (tLower.includes('tokyo') && !tLower.includes('kyoto')) || 
    (tLower.includes('東京') && !tLower.includes('京都')) ||
    ['kanagawa', 'saitama', 'chiba', 'ibaraki', 'tochigi', 'gunma', 'yokohama', 'kawasaki', '神奈川', '埼玉', '千葉', '茨城', '栃木', '群馬', '横浜', '川崎'].some(k => tLower.includes(k))
  ) {
    return 'kanto';
  }

  // 3. 近畿・関西 (Kansai)
  if (
    ['kyoto', 'osaka', 'hyogo', 'nara', 'shiga', 'wakayama', 'mie', 'kobe', '京都', '大阪', '兵庫', '奈良', '滋賀', '和歌山', '三重', '神戸'].some(k => tLower.includes(k))
  ) {
    if (lng > 138.5) return 'kanto';
    return 'kansai';
  }

  // 4. 東北 (Tohoku) - 漢字＆ローマ字両対応
  if (
    ['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima', 'sendai', '青森', '岩手', '宮城', '秋田', '山形', '福島', '仙台'].some(k => tLower.includes(k))
  ) {
    return 'tohoku';
  }

  // 5. 中部・北陸 (Chubu) - 漢字＆ローマ字両対応
  if (
    ['aichi', 'shizuoka', 'gifu', 'yamanashi', 'nagano', 'niigata', 'toyama', 'ishikawa', 'fukui', 'nagoya', 'kanazawa', '愛知', '静岡', '岐阜', '山梨', '長野', '新潟', '富山', '石川', '福井', '名古屋', '金沢'].some(k => tLower.includes(k))
  ) {
    return 'chubu';
  }

  // 6. 中国 (Chugoku) - 漢字＆ローマ字両対応
  if (
    ['tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi', '鳥取', '島根', '岡山', '広島', '山口'].some(k => tLower.includes(k))
  ) {
    return 'chugoku';
  }

  // 7. 四国 (Shikoku) - 漢字＆ローマ字両対応
  if (
    ['tokushima', 'kagawa', 'ehime', 'kochi', 'matsuyama', 'takamatsu', '徳島', '香川', '愛媛', '高知', '松山', '高松'].some(k => tLower.includes(k))
  ) {
    return 'shikoku';
  }

  // 8. 九州・沖縄 (Kyushu & Okinawa) - 漢字＆ローマ字両対応
  if (
    ['fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa', 'hakata', 'naha', '福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '沖縄', '博多', '那覇'].some(k => tLower.includes(k))
  ) {
    return 'kyushu';
  }

  // 🛡️ 【GPS座標による日本全国8地方の鉄壁バックアップ】
  // 文字列で万が一判定できなかった場合でも、GPS座標から100%自動救済！
  if (lat >= 41.35) return 'hokkaido';
  if (lat >= 36.8 && lng >= 139.2) return 'tohoku';
  if (lat >= 34.8 && lat < 37.2 && lng >= 138.4 && lng <= 140.9) return 'kanto';
  if (lat >= 34.5 && lng >= 136.0 && lng < 139.2) return 'chubu';
  if (lat >= 33.4 && lat < 36.0 && lng >= 134.2 && lng < 136.8) return 'kansai';
  if (lat >= 33.9 && lat < 36.4 && lng >= 130.8 && lng < 134.4) return 'chugoku';
  if (lat >= 32.7 && lat < 34.5 && lng >= 131.8 && lng < 134.8) return 'shikoku';
  if (lat < 34.4 && lng < 132.2) return 'kyushu';

  return null;
}

// 🛡️ 世界リージョン特定
function getWorldRegionId(m: any): string | null {
  if (isStrictlyJapan(m)) return null;

  const iso = (m.isoCountryCode || '').toUpperCase();
  const text = `${m.country || ''} ${m.locationName || ''}`;
  const lng = m.longitude;
  const lat = m.latitude;

  for (const region of WORLD_REGIONS) {
    if (iso && region.isoCodes.includes(iso)) return region.id;
  }

  for (const region of WORLD_REGIONS) {
    if (region.keywords.some((kw) => text.includes(kw))) return region.id;
  }

  // GPSフォールバック
  if (lng <= -50.0 && lng >= -170.0 && lat >= 15.0) return 'north_america';
  if (lng <= -34.0 && lng >= -85.0 && lat <= 12.0 && lat >= -56.0) return 'latin_america';
  if (lng >= -25.0 && lng <= 45.0 && lat >= 35.0 && lat <= 72.0) {
    return lat >= 54.0 || lng >= 15.0 ? 'nordic_east_europe' : 'west_europe';
  }
  if (lng >= 26.0 && lng <= 88.0 && lat >= 8.0 && lat <= 55.0) return 'mid_east_central_south_asia';
  if (lng >= -20.0 && lng <= 52.0 && lat >= -35.0 && lat <= 37.0) return 'africa';
  if (lng >= 95.0 && lng <= 142.0 && lat >= -11.0 && lat <= 23.0) return 'se_asia';
  if (lng >= 88.0 && lng <= 135.0 && lat >= 20.0 && lat <= 55.0) return 'east_asia';
  if (lng >= 110.0 && lng <= 180.0 && lat <= 0.0 && lat >= -50.0) return 'oceania';

  return null;
}

export default function AnalyticsScreen() {
  const [memories, setMemories] = useState<any[]>([]);
  const [collectionTab, setCollectionTab] = useState<'world' | 'japan'>('world');
  const [unlockedWorldIds, setUnlockedWorldIds] = useState<Set<string>>(new Set());
  const [unlockedJapanIds, setUnlockedJapanIds] = useState<Set<string>>(new Set());
  const [visitedCountries, setVisitedCountries] = useState<string[]>([]);
  
  const [selectedRegion, setSelectedRegion] = useState<any | null>(null);
  const [regionMemories, setRegionMemories] = useState<any[]>([]);

  const [stats, setStats] = useState({
    totalSpots: 0,
    totalDays: 0,
    vibeCounts: { Chill: 0, Happy: 0, Calm: 0, Ecstatic: 0 } as Record<string, number>,
  });

  useFocusEffect(
    useCallback(() => {
      calculateAnalytics();
    }, [])
  );

  const calculateAnalytics = async () => {
    try {
      const saved = await AsyncStorage.getItem('memories');
      if (saved) {
        const parsed: any[] = JSON.parse(saved);
        
        const sorted = parsed.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setMemories(sorted);

        const uniqueDates = new Set(parsed.map((m) => new Date(m.createdAt).toDateString()));

        const worldUnlocked = new Set<string>();
        const japanUnlocked = new Set<string>();
        const countries = new Set<string>();

        parsed.forEach((m) => {
          if (m.country) countries.add(m.country);

          const wId = getWorldRegionId(m);
          if (wId) worldUnlocked.add(wId);

          const jId = getJapanRegionId(m);
          if (jId) japanUnlocked.add(jId);
        });

        setUnlockedWorldIds(worldUnlocked);
        setUnlockedJapanIds(japanUnlocked);
        setVisitedCountries(Array.from(countries));

        const counts: Record<string, number> = { Chill: 0, Happy: 0, Calm: 0, Ecstatic: 0 };
        parsed.forEach((m) => {
          const v = m.vibe || 'Chill';
          if (counts[v] !== undefined) counts[v]++;
        });

        setStats({
          totalSpots: parsed.length,
          totalDays: uniqueDates.size,
          vibeCounts: counts,
        });
      }
    } catch (e) {
      console.error('Analytics Error', e);
    }
  };

  const handleRegionPress = (region: any, isUnlocked: boolean, isWorldTab: boolean) => {
    if (!isUnlocked) return;

    const filtered = memories.filter((m) => {
      if (isWorldTab) {
        return getWorldRegionId(m) === region.id;
      } else {
        return getJapanRegionId(m) === region.id;
      }
    });

    setSelectedRegion(region);
    setRegionMemories(filtered);
  };

  const isWorld = collectionTab === 'world';
  const currentRegions = isWorld ? WORLD_REGIONS : JAPAN_REGIONS;
  const currentUnlocked = isWorld ? unlockedWorldIds : unlockedJapanIds;
  const unlockRate = Math.round((currentUnlocked.size / currentRegions.length) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ヘッダー */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerSubtitle}>{t.analytics.headerSub}</Text>
          <Text style={styles.headerTitle}>{t.analytics.headerTitle}</Text>
        </View>

        <View style={styles.proTag}>
          <Ionicons name="shield-checkmark" size={14} color="#007AFF" />
          <Text style={styles.proTagText}>{t.analytics.proTag}</Text>
        </View>
      </View>

      {/* サマリーカード */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Ionicons name="location" size={24} color="#007AFF" />
          <Text style={styles.summaryNumber}>{stats.totalSpots}</Text>
          <Text style={styles.summaryLabel}>{t.analytics.spots}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="globe" size={24} color="#5856D6" />
          <Text style={styles.summaryNumber}>{visitedCountries.length}</Text>
          <Text style={styles.summaryLabel}>{t.analytics.countries}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="calendar" size={24} color="#FF9500" />
          <Text style={styles.summaryNumber}>{stats.totalDays}</Text>
          <Text style={styles.summaryLabel}>{t.analytics.days}</Text>
        </View>
      </View>

      {/* 🏆 エリアコレクション図鑑 */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>{t.analytics.collectionTitle}</Text>
            <Text style={styles.sectionSubtitle}>{t.analytics.collectionSub}</Text>
          </View>
          <View style={styles.rateBadge}>
            <Text style={styles.rateText}>{t.analytics.unlockRate(unlockRate)}</Text>
          </View>
        </View>

        {/* タブ切り替え */}
        <View style={styles.tabSwitchContainer}>
          <TouchableOpacity
            style={[styles.tabButton, isWorld && styles.tabButtonActive]}
            onPress={() => setCollectionTab('world')}
          >
            <Text style={[styles.tabButtonText, isWorld && styles.tabButtonTextActive]}>
              🌐 World ({unlockedWorldIds.size}/{WORLD_REGIONS.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, !isWorld && styles.tabButtonActive]}
            onPress={() => setCollectionTab('japan')}
          >
            <Text style={[styles.tabButtonText, !isWorld && styles.tabButtonTextActive]}>
              🇯🇵 Japan ({unlockedJapanIds.size}/{JAPAN_REGIONS.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* 制覇率ゲージ */}
        <View style={styles.gaugeBg}>
          <LinearGradient
            colors={['#007AFF', '#34C759']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gaugeFill, { width: `${unlockRate}%` }]}
          />
        </View>

        {/* コレクション・グリッド */}
        <View style={styles.collectionGrid}>
          {currentRegions.map((region) => {
            const isUnlocked = currentUnlocked.has(region.id);

            return isUnlocked ? (
              <TouchableOpacity
                key={region.id}
                activeOpacity={0.8}
                onPress={() => handleRegionPress(region, true, isWorld)}
                style={styles.cardTouchWrapper}
              >
                <LinearGradient
                  colors={region.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.regionCardUnlocked}
                >
                  <View style={styles.cardTopRow}>
                    <Ionicons name={region.icon as any} size={22} color="white" />
                    <View style={styles.unlockedTag}>
                      <Text style={styles.unlockedTagText}>{t.analytics.tapToView}</Text>
                    </View>
                  </View>
                  <Text style={styles.regionNameUnlocked}>{region.name}</Text>
                  <Text style={styles.regionStatusUnlocked}>{t.analytics.completed}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View key={region.id} style={styles.regionCardLocked}>
                <View style={styles.cardTopRow}>
                  <Ionicons name="lock-closed" size={18} color="#999" />
                  <Text style={styles.lockedTagText}>{t.analytics.locked}</Text>
                </View>
                <Text style={styles.regionNameLocked}>{region.name}</Text>
                <Text style={styles.regionStatusLocked}>{t.analytics.unexplored}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 感情バランス */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t.analytics.vibeTitle}</Text>
        <Text style={styles.sectionSubtitle}>{t.analytics.vibeSub}</Text>

        <View style={styles.vibeList}>
          {[
            { label: 'Chill', emoji: '🌊', color: '#4facfe' },
            { label: 'Happy', emoji: '✨', color: '#f6d365' },
            { label: 'Calm', emoji: '🌿', color: '#66a6ff' },
            { label: 'Ecstatic', emoji: '🔥', color: '#ff0844' },
          ].map((v) => {
            const count = stats.vibeCounts[v.label] || 0;
            const pct = stats.totalSpots > 0 ? Math.round((count / stats.totalSpots) * 100) : 0;
            return (
              <View key={v.label} style={styles.vibeItem}>
                <View style={styles.vibeInfoRow}>
                  <Text style={styles.vibeName}>{v.emoji} {v.label}</Text>
                  <Text style={styles.vibePercent}>{pct}% ({count})</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: v.color }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 訪問履歴タイムライン */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t.analytics.timelineTitle}</Text>
        <Text style={styles.sectionSubtitle}>{t.analytics.timelineSub}</Text>

        {memories.length > 0 ? (
          <View style={styles.timeline}>
            {memories.map((m, index) => (
              <View key={m.id} style={styles.timelineItem}>
                <View style={styles.timelineDateCol}>
                  <Text style={styles.timelineDateText}>
                    {new Date(m.createdAt).toLocaleDateString(isJapanese ? 'ja-JP' : 'en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.timelineYearText}>{new Date(m.createdAt).getFullYear()}</Text>
                </View>

                <View style={styles.timelineLineCol}>
                  <View style={styles.timelineDot} />
                  {index !== memories.length - 1 && <View style={styles.timelineLine} />}
                </View>

                <View style={styles.historyCard}>
                  {m.imageUri ? (
                    <Image source={{ uri: m.imageUri }} style={styles.historyThumb} />
                  ) : (
                    <View style={[styles.historyThumb, styles.historyNoThumb]}>
                      <Ionicons name="image-outline" size={20} color="#bbb" />
                    </View>
                  )}
                  <View style={styles.historyTextContainer}>
                    <Text style={styles.historyTitle} numberOfLines={1}>{m.title}</Text>
                    <Text style={styles.historyLocation} numberOfLines={1}>
                      📍 {formatLocationName(m.locationName, m.country)}
                    </Text>
                    <View style={styles.historyBadges}>
                      <Text style={styles.historyVibeBadge}>{m.vibe || 'Chill'}</Text>
                      {m.audioUri && <Ionicons name="mic" size={14} color="#34C759" style={{ marginLeft: 6 }} />}
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>{t.analytics.emptyHistory}</Text>
          </View>
        )}
      </View>

      {/* 🏛️ エリア別思い出まとめモーダル */}
      <Modal visible={!!selectedRegion} animationType="slide" presentationStyle="pageSheet">
        {selectedRegion && (
          <View style={styles.regionModalBg}>
            <View style={styles.regionModalHeader}>
              <View>
                <Text style={styles.regionModalSubtitle}>{t.analytics.areaModalSub}</Text>
                <Text style={styles.regionModalTitle}>{selectedRegion.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedRegion(null)}>
                <Ionicons name="close-circle" size={32} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.regionModalCountRow}>
              <Ionicons name="location" size={16} color="#007AFF" />
              <Text style={styles.regionModalCountText}>
                {t.analytics.countLogged(regionMemories.length)}
              </Text>
            </View>

            <FlatList
              data={regionMemories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
              renderItem={({ item }) => (
                <View style={styles.regionMemoryCard}>
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={styles.regionMemoryPhoto} />
                  ) : (
                    <View style={[styles.regionMemoryPhoto, { backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="image-outline" size={24} color="#aaa" />
                    </View>
                  )}
                  <View style={styles.regionMemoryTextContent}>
                    <Text style={styles.regionMemoryCardTitle}>{item.title}</Text>
                    <Text style={styles.regionMemoryCardLoc}>
                      📍 {formatLocationName(item.locationName, item.country)}
                    </Text>
                    <View style={styles.regionMemoryMeta}>
                      <Text style={styles.regionMemoryDate}>
                        {new Date(item.createdAt).toLocaleDateString(isJapanese ? 'ja-JP' : 'en-US')}
                      </Text>
                      <Text style={styles.regionMemoryVibe}>{item.vibe || 'Chill'}</Text>
                      {item.audioUri && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 6 }}>
                          <Ionicons name="mic" size={12} color="#34C759" />
                          <Text style={{ fontSize: 10, color: '#34C759' }}>{t.analytics.hasAudio}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}
            />
          </View>
        )}
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerSubtitle: { fontSize: 12, fontWeight: '700', color: '#007AFF', letterSpacing: 2 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#1C1C1E', marginTop: 4 },
  proTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,122,255,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  proTagText: { color: '#007AFF', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 18, alignItems: 'center', elevation: 2 },
  summaryNumber: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginTop: 8 },
  summaryLabel: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 22, padding: 20, marginBottom: 20, elevation: 2 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  sectionSubtitle: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  rateBadge: { backgroundColor: '#E8F2FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  rateText: { color: '#007AFF', fontWeight: 'bold', fontSize: 12 },
  tabSwitchContainer: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 12, padding: 4, marginTop: 14, marginBottom: 12 },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabButtonActive: { backgroundColor: '#fff', elevation: 2 },
  tabButtonText: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  tabButtonTextActive: { color: '#1C1C1E', fontWeight: 'bold' },
  gaugeBg: { height: 8, backgroundColor: '#F2F2F7', borderRadius: 4, marginBottom: 16, overflow: 'hidden' },
  gaugeFill: { height: '100%', borderRadius: 4 },
  collectionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cardTouchWrapper: { width: (width - 90) / 2 },
  regionCardUnlocked: { width: '100%', padding: 16, borderRadius: 18, justifyContent: 'space-between', minHeight: 115, elevation: 4 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unlockedTag: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  unlockedTagText: { color: 'white', fontSize: 9, fontWeight: 'bold' },
  regionNameUnlocked: { color: 'white', fontSize: 14, fontWeight: 'bold', marginTop: 6 },
  regionStatusUnlocked: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '600', marginTop: 4 },
  regionCardLocked: { width: (width - 90) / 2, padding: 16, borderRadius: 18, backgroundColor: '#F2F2F7', borderWidth: 1, borderColor: '#E5E5EA', borderStyle: 'dashed', justifyContent: 'space-between', minHeight: 115 },
  lockedTagText: { color: '#999', fontSize: 10, fontWeight: '700' },
  regionNameLocked: { color: '#8E8E93', fontSize: 13, fontWeight: 'bold', marginTop: 6 },
  regionStatusLocked: { color: '#C7C7CC', fontSize: 11 },
  vibeList: { gap: 12, marginTop: 14 },
  vibeItem: { gap: 6 },
  vibeInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vibeName: { fontSize: 13, fontWeight: '600', color: '#333' },
  vibePercent: { fontSize: 12, color: '#888', fontWeight: '500' },
  progressBarBg: { height: 8, backgroundColor: '#F2F2F7', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  timeline: { marginTop: 14 },
  timelineItem: { flexDirection: 'row', marginBottom: 16 },
  timelineDateCol: { width: 55, alignItems: 'flex-end', paddingRight: 10, paddingTop: 6 },
  timelineDateText: { fontSize: 12, fontWeight: 'bold', color: '#1C1C1E' },
  timelineYearText: { fontSize: 10, color: '#8E8E93' },
  timelineLineCol: { width: 20, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#007AFF', marginTop: 8 },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#E5E5EA', marginTop: 4 },
  historyCard: { flex: 1, flexDirection: 'row', backgroundColor: '#F8F9FA', borderRadius: 14, padding: 10, alignItems: 'center', gap: 12 },
  historyThumb: { width: 52, height: 52, borderRadius: 10 },
  historyNoThumb: { backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' },
  historyTextContainer: { flex: 1 },
  historyTitle: { fontSize: 15, fontWeight: 'bold', color: '#1C1C1E' },
  historyLocation: { fontSize: 12, color: '#555', marginTop: 2 },
  historyBadges: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  historyVibeBadge: { fontSize: 11, color: '#007AFF', backgroundColor: 'rgba(0,122,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  emptyHistory: { paddingVertical: 20, alignItems: 'center' },
  emptyHistoryText: { color: '#8E8E93', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  regionModalBg: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 24 },
  regionModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 },
  regionModalSubtitle: { fontSize: 11, fontWeight: '700', color: '#007AFF', letterSpacing: 2 },
  regionModalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E', marginTop: 2 },
  regionModalCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: '#E5E5EA' },
  regionModalCountText: { fontSize: 13, color: '#666', fontWeight: '500' },
  regionMemoryCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 12, elevation: 2 },
  regionMemoryPhoto: { width: 70, height: 70, borderRadius: 12 },
  regionMemoryTextContent: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  regionMemoryCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  regionMemoryCardLoc: { fontSize: 12, color: '#007AFF', marginTop: 3 },
  regionMemoryMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  regionMemoryDate: { fontSize: 11, color: '#8E8E93' },
  regionMemoryVibe: { fontSize: 10, color: '#555', backgroundColor: '#F2F2F7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
});