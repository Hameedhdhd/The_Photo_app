import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, ScrollView, Alert, Animated } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Ensure you start the backend server with: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
// Using localtunnel to bypass firewall for testing
const API_URL = 'https://itchy-moons-invent.loca.lt/api/analyze-image';

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (result) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
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
    } else {
      pulseAnim.setValue(1);
    }
  }, [loading]);

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You've refused to allow this app to access your camera!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
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
      allowsEditing: true,
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

      const formData = new FormData();
      formData.append('file', { uri: uri, name: filename, type: type });

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Analysis Failed', 'Could not connect to the AI backend. Make sure the FastAPI server is running.');
      setImageUri(null); // reset UI on failure
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setImageUri(null);
    setResult(null);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.header}>
        <Ionicons name="camera-outline" size={40} color="#fff" style={styles.headerIcon} />
        <Text style={styles.title}>List It Fast</Text>
        <Text style={styles.subtitle}>AI-Powered Selling Assistant</Text>
      </LinearGradient>
      
      <View style={styles.contentContainer}>
        {!imageUri && !loading && (
          <View style={styles.actionContainer}>
            <View style={styles.illustrationContainer}>
              <Ionicons name="images-outline" size={100} color="#cbd5e1" />
              <Text style={styles.emptyStateText}>Ready to sell something?</Text>
            </View>
            
            <TouchableOpacity style={styles.primaryButton} onPress={takePhoto} activeOpacity={0.8}>
              <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.buttonGradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
                <Ionicons name="camera" size={24} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Take Photo</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={pickImage} activeOpacity={0.7}>
              <Ionicons name="image" size={22} color="#4c669f" style={styles.buttonIcon} />
              <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {imageUri && (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            {loading && (
              <Animated.View style={[styles.loadingOverlay, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.glassCard}>
                  <ActivityIndicator size="large" color="#FF6B6B" />
                  <Text style={styles.loadingText}>Analyzing item with AI...</Text>
                  <Text style={styles.loadingSubText}>Extracting details, price, and category</Text>
                </View>
              </Animated.View>
            )}
          </View>
        )}

        {result && !loading && (
          <Animated.ScrollView 
            style={[styles.resultContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]} 
            contentContainerStyle={styles.resultContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={28} color="#28a745" />
              <Text style={styles.successTitle}>Listing Generated!</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.resultLabel}>Suggested Title</Text>
              <Text style={styles.resultTitleValue}>{result.title}</Text>
            </View>
            
            <View style={styles.rowCards}>
              <View style={[styles.card, styles.flexCard]}>
                <Text style={styles.resultLabel}>Estimated Price</Text>
                <Text style={styles.resultPrice}>{result.price}</Text>
              </View>
              <View style={[styles.card, styles.flexCard]}>
                <Text style={styles.resultLabel}>Category</Text>
                <Text style={styles.resultCategory}>{result.category}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.resultLabel}>Description</Text>
              <Text style={styles.resultDescription}>{result.description}</Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={resetState} activeOpacity={0.8}>
              <LinearGradient colors={['#4c669f', '#192f6a']} style={styles.buttonGradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
                <Ionicons name="refresh" size={22} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Scan Another Item</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Slate 50
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  headerIcon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    marginTop: 5,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  actionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  emptyStateText: {
    marginTop: 15,
    fontSize: 20,
    color: '#94a3b8',
    fontWeight: '600',
  },
  primaryButton: {
    width: '100%',
    marginBottom: 15,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  secondaryButtonText: {
    color: '#4c669f',
    fontSize: 18,
    fontWeight: '700',
  },
  imageWrapper: {
    alignItems: 'center',
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  loadingSubText: {
    marginTop: 5,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
    marginTop: 10,
  },
  resultContent: {
    paddingBottom: 40,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#28a745',
    marginLeft: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  rowCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  flexCard: {
    flex: 1,
    marginBottom: 15,
  },
  resultLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  resultTitleValue: {
    fontSize: 20,
    color: '#1e293b',
    fontWeight: '700',
  },
  resultPrice: {
    fontSize: 26,
    color: '#FF6B6B',
    fontWeight: '900',
  },
  resultCategory: {
    fontSize: 18,
    color: '#4c669f',
    fontWeight: '600',
  },
  resultDescription: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 26,
  }
});
