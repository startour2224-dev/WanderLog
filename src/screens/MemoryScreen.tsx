import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert, Image, Modal, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { t, isJapanese, formatLocationName } from '../i18n/translations'; // formatLocationName を読み込み

interface Memory {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  imageUri?: string;
  audioUri?: string;
  vibe?: string;
  locationName?: string;
  country?: string;
  createdAt: string;
}

export default function MemoryScreen() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [activePlayer, setActivePlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const shareCardRef = useRef<View>(null);

  useFocusEffect(
    useCallback(() => {
      loadMemories();
      return () => {
        if (activePlayer) {
          activePlayer.pause();
        }
      };
    }, [activePlayer])
  );

  const loadMemories = async () => {
    const savedMemories = await AsyncStorage.getItem('memories');
    if (savedMemories) setMemories(JSON.parse(savedMemories));
  };

  const playSound = async (uri: string) => {
    try {
      if (activePlayer) activePlayer.pause();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const player = createAudioPlayer({ uri });
      setActivePlayer(player);
      setIsPlaying(true);
      player.play();
    } catch (e: any) {
      Alert.alert(isJapanese ? "再生エラー" : "Playback Error", e.message);
      setIsPlaying(false);
    }
  };

  const shareCinematicCard = async () => {
    if (!shareCardRef.current) return;
    try {
      setIsSharing(true);
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 1.0,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: t.memories.shareBtn,
          UTI: 'public.png',
        });
      } else {
        Alert.alert(
          isJapanese ? 'エラー' : 'Error', 
          isJapanese ? 'この端末では共有機能が利用できません' : 'Sharing is not available on this device'
        );
      }
    } catch (error: any) {
      Alert.alert(isJapanese ? 'シェア失敗' : 'Share Failed', error.message);
    } finally {
      setIsSharing(false);
    }
  };

  const deleteMemory = (id: string) => {
    Alert.alert(
      t.memories.deleteTitle, 
      t.memories.deleteConfirm, 
      [
        { text: t.memories.cancel, style: "cancel" },
        { 
          text: t.memories.delete, 
          style: "destructive", 
          onPress: async () => {
            const updated = memories.filter(m => m.id !== id);
            setMemories(updated);
            await AsyncStorage.setItem('memories', JSON.stringify(updated));
            setSelectedMemory(null);
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Memory }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedMemory(item)}>
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.noImage]}>
          <Ionicons name="image-outline" size={30} color="#ccc" />
        </View>
      )}
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {/* 🌟 英語モードなら自動で英語（Japan · Tokyo等）に変換される地名 */}
        <Text style={styles.cardLocation} numberOfLines={1}>
          📍 {formatLocationName(item.locationName, item.country)}
        </Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardSubText}>
            {new Date(item.createdAt).toLocaleDateString(isJapanese ? 'ja-JP' : 'en-US')}
          </Text>
          {item.vibe && <Text style={styles.cardVibeTag}>{item.vibe}</Text>}
          {item.audioUri && <Ionicons name="mic" size={13} color="#4CD964" style={{ marginLeft: 6 }} />}
        </View>
      </View>
      <TouchableOpacity onPress={() => deleteMemory(item.id)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderSubtitle}>{t.memories.headerSub}</Text>
        <Text style={styles.listHeaderTitle}>{t.memories.headerTitle}</Text>
      </View>

      <FlatList 
        data={memories} 
        keyExtractor={(item) => item.id} 
        renderItem={renderItem} 
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>{t.memories.emptyText}</Text>
          </View>
        }
      />

      <Modal visible={!!selectedMemory} animationType="slide" transparent={false}>
        {selectedMemory && (
          <View style={styles.detailContainer}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => {
                if (activePlayer) activePlayer.pause();
                setSelectedMemory(null);
                setIsPlaying(false);
              }}
            >
              <Ionicons name="close-circle" size={38} color="white" />
            </TouchableOpacity>

            <View style={styles.cardWrapper}>
              <View ref={shareCardRef} collapsable={false} style={styles.shareCard}>
                {selectedMemory.imageUri ? (
                  <Image source={{ uri: selectedMemory.imageUri }} style={styles.cardPhoto} />
                ) : (
                  <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.cardPhotoPlaceholder}>
                    <Ionicons name="compass-outline" size={80} color="rgba(255,255,255,0.4)" />
                  </LinearGradient>
                )}

                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardOverlay}>
                  <View style={styles.cardHeaderInfo}>
                    <View style={styles.cardVibeBadge}>
                      <Text style={styles.cardVibeText}>{selectedMemory.vibe || 'Chill'}</Text>
                    </View>
                    {/* 🌟 シネマティックカード内の地名も英語化 */}
                    <Text style={styles.cardLocationText}>
                      📍 {formatLocationName(selectedMemory.locationName, selectedMemory.country)}
                    </Text>
                  </View>

                  <Text style={styles.cardMainTitle}>{selectedMemory.title}</Text>
                  
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardDateText}>
                      {new Date(selectedMemory.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                    <Text style={styles.cardBranding}>WANDERLOG · JOURNEY</Text>
                  </View>
                </LinearGradient>
              </View>
            </View>

            <View style={styles.actionSection}>
              {selectedMemory.audioUri && (
                <TouchableOpacity style={styles.playAudioBtn} onPress={() => playSound(selectedMemory.audioUri!)}>
                  <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={36} color="#4CD964" />
                  <Text style={styles.playAudioText}>
                    {isPlaying ? t.memories.playing : t.memories.playAudio}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.shareButton} 
                onPress={shareCinematicCard}
                disabled={isSharing}
              >
                {isSharing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="share-outline" size={22} color="white" />
                    <Text style={styles.shareButtonText}>{t.memories.shareBtn}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  listHeader: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  listHeaderSubtitle: { fontSize: 12, fontWeight: '700', color: '#007AFF', letterSpacing: 2 },
  listHeaderTitle: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', marginTop: 4 },
  listContent: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: 'white', borderRadius: 16, marginBottom: 14, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardImage: { width: 85, height: 85 },
  noImage: { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  cardTextContainer: { flex: 1, padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  cardLocation: { fontSize: 12, color: '#007AFF', marginTop: 3 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  cardSubText: { fontSize: 11, color: '#8E8E93' },
  cardVibeTag: { marginLeft: 8, fontSize: 10, color: '#555', backgroundColor: '#F2F2F7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  deleteButton: { padding: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 100, gap: 12 },
  emptyText: { color: '#8E8E93', textAlign: 'center', lineHeight: 22 },
  detailContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'space-between', paddingVertical: 50, paddingHorizontal: 20 },
  closeButton: { alignSelf: 'flex-end', zIndex: 10, padding: 6 },
  cardWrapper: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  shareCard: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#111',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  cardPhoto: { width: '100%', height: '100%', position: 'absolute' },
  cardPhotoPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  cardOverlay: { flex: 1, justifyContent: 'space-between', padding: 24 },
  cardHeaderInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardVibeBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  cardVibeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  cardLocationText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
  cardMainTitle: { color: 'white', fontSize: 32, fontWeight: 'bold', lineHeight: 40 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.3)', paddingTop: 12 },
  cardDateText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 1 },
  cardBranding: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  actionSection: { gap: 12, marginTop: 10 },
  playAudioBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 10, borderRadius: 14 },
  playAudioText: { color: 'white', fontSize: 14, fontWeight: '600' },
  shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 16 },
  shareButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});