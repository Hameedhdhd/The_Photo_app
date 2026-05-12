import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Image,
  ActivityIndicator, ScrollView, Alert, Animated, Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';

// Backend API URL — update when localtunnel URL changes
const API_URL = 'https://short-insects-clap.loca.lt/api/analyze-image';

const ROOMS = ['Kitchen', 'Bathroom', 'Bedroom', 'Living Room', 'Garage', 'Electrical', 'Other'];

export default function HomeScreen({ navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('Other');
  const [lang, setLang] = useState('de'); // 'en' or 'de'
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (result) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [result]);

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else { pulseAnim.setValue(1); }
  }, [loading]);

  const getSessionUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Camera access is needed.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true, // Use built-in cropper for stability
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, // Use built-in cropper for stability
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const analyzeImage = async (uri) => {
    setLoading(true);
    setResult(null);
    try {
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      const uid = await getSessionUserId();

      const formData = new FormData();
      formData.append('file', { uri, name: filename, type });
      formData.append('room', selectedRoom);
      if (uid) formData.append('user_id', uid);

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json', 'Content-Type': 'multipart/form-data' },
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Analysis Failed', 'Could not connect to backend.');
      setImageUri(null);
    } finally { setLoading(false); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleLogout} style={{ flex: 1 }}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 2 }}>
            <Text style={styles.title}>List It Fast</Text>
          </View>
          <View style={{ flex: 1 }} />
        </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
        {!imageUri && !loading && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.roomSection}>
              <Text style={styles.sectionLabel}>Select Room / Section:</Text>
              <View style={styles.roomChips}>
                {ROOMS.map(room => (
                  <TouchableOpacity 
                    key={room} 
                    style={[styles.chip, selectedRoom === room && styles.chipSelected]}
                    onPress={() => setSelectedRoom(room)}
                  >
                    <Text style={[styles.chipText, selectedRoom === room && styles.chipTextSelected]}>{room}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.actionContainer}>
              <View style={styles.illustrationContainer}>
                <Ionicons name="images-outline" size={100} color="#cbd5e1" />
                <Text style={styles.emptyStateText}>Ready to sell?</Text>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={takePhoto} activeOpacity={0.8}>
                <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="camera" size={24} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Take Photo</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={pickImage} activeOpacity={0.7}>
                <Ionicons name="image" size={22} color="#4c669f" style={styles.buttonIcon} />
                <Text style={styles.secondaryButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {imageUri && (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            {loading && (
              <Animated.View style={[styles.loadingOverlay, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.glassCard}>
                  <ActivityIndicator size="large" color="#FF6B6B" />
                  <Text style={styles.loadingText}>AI is thinking...</Text>
                </View>
              </Animated.View>
            )}
          </View>
        )}

        {result && !loading && (
          <Animated.ScrollView 
            style={[styles.resultContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.langToggle}>
              <TouchableOpacity style={[styles.langBtn, lang === 'de' && styles.langBtnActive]} onPress={() => setLang('de')}>
                <Text style={[styles.langBtnText, lang === 'de' && styles.langBtnTextActive]}>Deutsch 🇩🇪</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.langBtn, lang === 'en' && styles.langBtnActive]} onPress={() => setLang('en')}>
                <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>English 🇺🇸</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.resultLabel}>Item ID</Text>
              <Text style={styles.resultItemId}>{result.item_id || 'N/A'}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.resultLabel}>Suggested Title</Text>
              <Text style={styles.resultTitleValue}>{result.title}</Text>
            </View>
            
            <View style={styles.rowCards}>
              <View style={[styles.card, styles.flexCard]}><Text style={styles.resultLabel}>Price</Text><Text style={styles.resultPrice}>{result.price}</Text></View>
              <View style={[styles.card, styles.flexCard]}><Text style={styles.resultLabel}>Room</Text><Text style={styles.resultCategory}>{selectedRoom}</Text></View>
            </View>

            <View style={styles.card}>
              <Text style={styles.resultLabel}>Description ({lang.toUpperCase()})</Text>
              <Text style={styles.resultDescription}>
                {lang === 'en' ? result.description_en : result.description_de}
              </Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={() => {setImageUri(null); setResult(null);}}>
              <LinearGradient colors={['#4c669f', '#192f6a']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.buttonText}>Scan Another</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.ScrollView>
        )}
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 8, zIndex: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  contentContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  roomSection: { marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 10, textTransform: 'uppercase' },
  roomChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  chipSelected: { backgroundColor: '#4c669f', borderColor: '#4c669f' },
  chipText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  actionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  illustrationContainer: { alignItems: 'center', marginBottom: 30 },
  emptyStateText: { marginTop: 15, fontSize: 18, color: '#94a3b8', fontWeight: '600' },
  primaryButton: { width: '100%', marginBottom: 15, elevation: 6 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16 },
  buttonIcon: { marginRight: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  secondaryButton: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 16, borderRadius: 16, width: '100%', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  secondaryButtonText: { color: '#4c669f', fontSize: 18, fontWeight: '700' },
  imageWrapper: { alignItems: 'center', borderRadius: 20, overflow: 'hidden', elevation: 10, marginBottom: 20 },
  previewImage: { width: '100%', aspectRatio: 4/3, borderRadius: 20 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  glassCard: { backgroundColor: 'rgba(255,255,255,0.95)', padding: 25, borderRadius: 20, alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 18, fontWeight: '700', color: '#334155' },
  resultContainer: { flex: 1 },
  langToggle: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  langBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f5f9' },
  langBtnActive: { backgroundColor: '#FF6B6B' },
  langBtnText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  langBtnTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 10, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  rowCards: { flexDirection: 'row', gap: 10 },
  flexCard: { flex: 1 },
  resultLabel: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginBottom: 5 },
  resultItemId: { fontSize: 14, color: '#4c669f', fontWeight: '800' },
  resultTitleValue: { fontSize: 18, color: '#1e293b', fontWeight: '700' },
  resultPrice: { fontSize: 22, color: '#FF6B6B', fontWeight: '900' },
  resultCategory: { fontSize: 16, color: '#4c669f', fontWeight: '600' },
  resultDescription: { fontSize: 15, color: '#475569', lineHeight: 22 },
});
