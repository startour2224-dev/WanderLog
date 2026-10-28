import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Dimensions, ImageBackground, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { t, isJapanese, formatLocationName } from '../i18n/translations'; // formatLocationName を読み込み

const { width, height } = Dimensions.get('window');

interface DisplayMemory {
  id: string;
  title: string;
  imageUri?: string;
  audioUri?: string;
  vibe?: string;
  locationName?: string;
  country?: string;
  createdAt: string;
  tag: string;
}

export default function HomeScreen() {
  const [currentMemory, setCurrentMemory] = useState<DisplayMemory | null>(null);
  const [allMemories, setAllMemories] = useState<any[]>([]);
  const [bgmPlayer, setBgmPlayer] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      loadMemoriesAndPick();
      return () => {
        if (bgmPlayer) bgmPlayer.pause();
      };
    }, [bgmPlayer])
  );

  const loadMemoriesAndPick = async () => {
    try {
      const saved = await AsyncStorage.getItem('memories');
      if (saved) {
        const parsed = JSON.parse(saved);
        setAllMemories(parsed);
        pickBestMemory(parsed);
      } else {
        setCurrentMemory(null);
      }
    } catch (e) {
      console.error("Load Error", e);
    }
  };

  const pickBestMemory = (list: any[]) => {
    if (list.length === 0) {
      setCurrentMemory(null);
      return;
    }

    const today = new Date();

    const onThisDayMatches = list.filter((m: any) => {
      const d = new Date(m.createdAt);
      return (
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate() &&
        d.getFullYear() < today.getFullYear()
      );
    });

    if (onThisDayMatches.length > 0) {
      const selected = onThisDayMatches[0];
      const yearsAgo = today.getFullYear() - new Date(selected.createdAt).getFullYear();
      applyMemory(selected, t.home.yearsAgo(yearsAgo));
      return;
    }

    pickRandomMemory(list);
  };

  const pickRandomMemory = (list: any[]) => {
    if (list.length === 0) return;
    const randomIndex = Math.floor(Math.random() * list.length);
    const selected = list[randomIndex];

    const today = new Date();
    const created = new Date(selected.createdAt);
    const diffTime = Math.abs(today.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const tag = diffDays === 0 ? t.home.today : t.home.daysAgo(diffDays);
    applyMemory(selected, tag);
  };

  const applyMemory = (memory: any, tag: string) => {
    setCurrentMemory({ ...memory, tag });
    if (memory.audioUri) {
      playChillBgm(memory.audioUri);
    } else if (bgmPlayer) {
      bgmPlayer.pause();
    }
  };

  const playChillBgm = async (uri: string) => {
    try {
      if (bgmPlayer) bgmPlayer.pause();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const player = createAudioPlayer({ uri });
      player.loop = true;
      player.play();
      setBgmPlayer(player);
    } catch (e) {
      console.log("Chill BGM error", e);
    }
  };

  return (
    <View style={styles.container}>
      {currentMemory ? (
        <ImageBackground 
          source={currentMemory.imageUri ? { uri: currentMemory.imageUri } : undefined} 
          style={[styles.bgImage, !currentMemory.imageUri && { backgroundColor: '#1C1C1E' }]}
        >
          <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']} style={styles.gradient}>
            
            <View style={styles.topBar}>
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{currentMemory.tag}</Text>
              </View>

              {allMemories.length > 1 && (
                <TouchableOpacity style={styles.shuffleBtn} onPress={() => pickRandomMemory(allMemories)}>
                  <Ionicons name="shuffle" size={18} color="white" />
                  <Text style={styles.shuffleText}>{t.home.shuffle}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.content}>
              <View style={styles.badgeRow}>
                <Text style={styles.vibeBadge}>{currentMemory.vibe || 'Chill'}</Text>
                {/* 🌟 英語モードなら自動で英語表記に変換 */}
                {(currentMemory.locationName || currentMemory.country) && (
                  <View style={styles.locationTag}>
                    <Ionicons name="location-sharp" size={12} color="#fff" />
                    <Text style={styles.locationTagText}>
                      {formatLocationName(currentMemory.locationName, currentMemory.country)}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.mainTitle}>{currentMemory.title}</Text>
              <Text style={styles.dateSubText}>
                {new Date(currentMemory.createdAt).toLocaleDateString(isJapanese ? 'ja-JP' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>

              {currentMemory.audioUri && (
                <View style={styles.audioIndicator}>
                  <Ionicons name="musical-notes" size={18} color="#4CD964" />
                  <Text style={styles.audioText}>{t.home.ambientSound}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </ImageBackground>
      ) : (
        <View style={styles.emptyContainer}>
          <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.emptyGradient}>
            <Ionicons name="compass-outline" size={80} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyTitle}>{t.home.emptyTitle}</Text>
            <Text style={styles.emptySub}>{t.home.emptySub}</Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bgImage: { width: width, height: height },
  gradient: { flex: 1, justifyContent: 'space-between', padding: 25, paddingTop: 60, paddingBottom: 100 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  tagText: { color: 'white', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
  shuffleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  shuffleText: { color: 'white', fontSize: 12 },
  content: { gap: 10 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vibeBadge: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 'bold' },
  locationTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  locationTagText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  mainTitle: { color: '#fff', fontSize: 36, fontWeight: 'bold', lineHeight: 44 },
  dateSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  audioIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' },
  audioText: { color: '#4CD964', fontSize: 12, fontWeight: '500' },
  emptyContainer: { flex: 1 },
  emptyGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 20, letterSpacing: 4 },
  emptySub: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 15, lineHeight: 24, fontSize: 16 }
});