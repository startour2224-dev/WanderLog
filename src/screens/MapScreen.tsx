import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { t, isJapanese } from '../i18n/translations'; // 辞書を読み込み

const VIBES = [
  { label: 'Chill', emoji: '🌊', color: '#4facfe' },
  { label: 'Happy', emoji: '✨', color: '#f6d365' },
  { label: 'Calm', emoji: '🌿', color: '#66a6ff' },
  { label: 'Ecstatic', emoji: '🔥', color: '#ff0844' },
];

export interface Memory {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  imageUri?: string;
  audioUri?: string;
  vibe?: string;
  locationName?: string;
  country?: string;
  isoCountryCode?: string;
  prefecture?: string;
  createdAt: string;
}

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [tempCoords, setTempCoords] = useState({ latitude: 0, longitude: 0 });
  
  const [detectedPlace, setDetectedPlace] = useState<string>('');
  const [detectedCountry, setDetectedCountry] = useState<string>('');
  const [detectedIsoCode, setDetectedIsoCode] = useState<string>('');
  const [detectedPrefecture, setDetectedPrefecture] = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState('Chill');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted' && !location) {
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    }
    const savedMemories = await AsyncStorage.getItem('memories');
    if (savedMemories) setMemories(JSON.parse(savedMemories));
  };

  const reverseGeocode = async (coords: { latitude: number; longitude: number }) => {
    setIsGeocoding(true);
    try {
      const results = await Location.reverseGeocodeAsync(coords);
      if (results && results.length > 0) {
        const place = results[0];
        const pref = place.region || '';
        const city = place.city || place.subregion || place.district || '';
        const area = [pref, city].filter(Boolean).join(' ');
        
        const finalName = area || place.name || place.country || (isJapanese ? '旅のスポット' : 'Travel Spot');
        setDetectedPlace(finalName);
        setDetectedCountry(place.country || '');
        setDetectedPrefecture(pref);
        setDetectedIsoCode(place.isoCountryCode ? place.isoCountryCode.toUpperCase() : '');
      } else {
        setDetectedPlace(t.map.unknownSpot);
      }
    } catch (e) {
      setDetectedPlace(isJapanese ? '旅のスポット' : 'Travel Spot');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleMapLongPress = (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setTempCoords(coords);
    setSelectedImage(null);
    setRecordedAudioUri(null);
    setIsRecording(false);
    setNewTitle('');

    setDetectedPlace('');
    setDetectedCountry('');
    setDetectedIsoCode('');
    setDetectedPrefecture('');

    setModalVisible(true);
    reverseGeocode(coords);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      try {
        await recorder.stop();
        setIsRecording(false);
        const uri = recorder.uri;
        if (uri) {
          const fs: any = FileSystem;
          const docDir = fs.documentDirectory || fs.cacheDirectory;
          if (docDir) {
            const newPath = docDir + `audio_${Date.now()}.m4a`;
            await FileSystem.copyAsync({ from: uri, to: newPath });
            setRecordedAudioUri(newPath);
          } else {
            setRecordedAudioUri(uri);
          }
        }
      } catch (e: any) {
        setIsRecording(false);
        Alert.alert(isJapanese ? "録音エラー" : "Recording Error", e.message);
      }
    } else {
      try {
        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) {
          Alert.alert(t.map.micPermission);
          return;
        }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
        setIsRecording(true);
      } catch (e: any) {
        Alert.alert(isJapanese ? "録音開始エラー" : "Start Recording Error", e.message);
      }
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      const sourceUri = result.assets[0].uri;
      try {
        const fs: any = FileSystem;
        const docDir = fs.documentDirectory || fs.cacheDirectory;
        if (docDir) {
          const newPath = docDir + `photo_${Date.now()}.jpg`;
          await FileSystem.copyAsync({ from: sourceUri, to: newPath });
          setSelectedImage(newPath);
        } else {
          setSelectedImage(sourceUri);
        }
      } catch (e) {
        setSelectedImage(sourceUri);
      }
    }
  };

  const saveMemory = async () => {
    if (!newTitle) {
      Alert.alert(t.map.titleRequired);
      return;
    }
    if (isGeocoding) {
      Alert.alert(
        isJapanese ? "解析中" : "Analyzing", 
        isJapanese ? "現在、地名を解析しています。少々お待ちください。" : "Currently analyzing location. Please wait a moment."
      );
      return;
    }
    if (isRecording) {
      await recorder.stop();
      setIsRecording(false);
    }

    const newMemory: Memory = {
      id: Date.now().toString(),
      latitude: tempCoords.latitude,
      longitude: tempCoords.longitude,
      title: newTitle,
      imageUri: selectedImage || undefined,
      audioUri: recordedAudioUri || undefined,
      vibe: selectedVibe,
      locationName: detectedPlace || (isJapanese ? '旅のスポット' : 'Travel Spot'),
      country: detectedCountry,
      isoCountryCode: detectedIsoCode,
      prefecture: detectedPrefecture,
      createdAt: new Date().toISOString(),
    };

    const updatedMemories = [...memories, newMemory];
    setMemories(updatedMemories);
    await AsyncStorage.setItem('memories', JSON.stringify(updatedMemories));
    
    setModalVisible(false);
    setSelectedImage(null);
    setRecordedAudioUri(null);
    setIsRecording(false);
    setNewTitle('');
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onLongPress={handleMapLongPress}
        >
          {memories.map((memory) => (
            <Marker 
              key={memory.id} 
              coordinate={{ latitude: memory.latitude, longitude: memory.longitude }} 
              title={memory.title} 
              description={memory.locationName}
              pinColor="blue" 
            />
          ))}
        </MapView>
      )}

      {/* 📍 英語・日本語自動切り替えのガイド表示 */}
      <View style={styles.guideBadge}>
        <Text style={styles.guideText}>{t.map.guide}</Text>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            
            <View style={styles.locationHeader}>
              <Ionicons name="location-sharp" size={18} color="#007AFF" />
              {isGeocoding ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 6 }}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.locationHeaderText}>{t.map.analyzing}</Text>
                </View>
              ) : (
                <Text style={styles.locationHeaderText}>
                  {detectedCountry ? `${detectedCountry} · ` : ''}{detectedPlace || (isJapanese ? '位置情報取得完了' : 'Location Set')}
                </Text>
              )}
            </View>

            <Text style={styles.modalTitle}>{t.map.vibeQuestion}</Text>
            
            <View style={styles.vibeRow}>
              {VIBES.map((v) => (
                <TouchableOpacity 
                  key={v.label} 
                  style={[styles.vibeButton, selectedVibe === v.label && { backgroundColor: v.color }]}
                  onPress={() => setSelectedVibe(v.label)}
                >
                  <Text style={styles.vibeEmoji}>{v.emoji}</Text>
                  <Text style={[styles.vibeLabel, selectedVibe === v.label && { color: 'white' }]}>{v.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.mediaRow}>
              <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                {selectedImage ? <Image source={{ uri: selectedImage }} style={styles.previewImage} /> : (
                  <>
                    <Ionicons name="camera" size={28} color="#007AFF" />
                    <Text style={styles.mediaHint}>{t.map.photoOptional}</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity 
                  style={[styles.mediaButton, isRecording && styles.recordingActive]} 
                  onPress={toggleRecording}
                >
                  <Ionicons 
                    name={isRecording ? "stop-circle" : (recordedAudioUri ? "checkmark-circle" : "mic")} 
                    size={30} 
                    color={isRecording ? "white" : (recordedAudioUri ? "#4CD964" : "#007AFF")} 
                  />
                  <Text style={[styles.mediaHint, isRecording && { color: 'white' }]}>
                    {isRecording ? t.map.recording : (recordedAudioUri ? t.map.recorded : t.map.audioOptional)}
                  </Text>
                </TouchableOpacity>

                {recordedAudioUri && !isRecording && (
                  <TouchableOpacity onPress={() => setRecordedAudioUri(null)} style={styles.clearAudioBtn}>
                    <Text style={styles.clearAudioText}>{t.map.deleteAudio}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TextInput 
              style={styles.input} 
              placeholder={t.map.inputPlaceholder} 
              value={newTitle} 
              onChangeText={setNewTitle} 
              returnKeyType="done" 
              onSubmitEditing={saveMemory} 
            />
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={saveMemory}>
                <Text style={styles.buttonText}>{t.map.save}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>{t.map.back}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  guideBadge: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  guideText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 30, alignItems: 'center' },
  locationHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,122,255,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  locationHeaderText: { fontSize: 13, fontWeight: '600', color: '#007AFF', marginLeft: 4 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  vibeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  vibeButton: { padding: 10, borderRadius: 15, backgroundColor: '#f0f0f0', alignItems: 'center', minWidth: 65 },
  vibeEmoji: { fontSize: 20 },
  vibeLabel: { fontSize: 10, marginTop: 4, color: '#666' },
  mediaRow: { flexDirection: 'row', gap: 25, marginBottom: 20 },
  mediaButton: { width: 95, height: 95, backgroundColor: '#f0f0f0', borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  recordingActive: { backgroundColor: '#FF3B30' },
  previewImage: { width: '100%', height: '100%' },
  mediaHint: { fontSize: 11, marginTop: 4, color: '#666' },
  clearAudioBtn: { marginTop: 6, paddingVertical: 2, paddingHorizontal: 8 },
  clearAudioText: { color: '#FF3B30', fontSize: 11 },
  input: { width: '100%', borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 25, padding: 10, fontSize: 16 },
  buttonContainer: { flexDirection: 'row', gap: 15 },
  saveButton: { backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 35, borderRadius: 15 },
  cancelButton: { backgroundColor: '#8E8E93', paddingVertical: 12, paddingHorizontal: 35, borderRadius: 15 },
  buttonText: { color: 'white', fontWeight: 'bold' }
});