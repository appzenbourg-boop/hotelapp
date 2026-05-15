import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../services/api';
import { Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

export default function ChangePersonalDetails() {
  const insets = useSafeAreaInsets();
  const { user, token, login } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [idType, setIdType] = useState(user?.idType || 'Aadhaar Card');
  const [idNumber, setIdNumber] = useState(user?.idNumber || '');
  const [idDocumentFront, setIdDocumentFront] = useState(user?.idDocumentFront || null);
  const [idDocumentBack, setIdDocumentBack] = useState(user?.idDocumentBack || null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingIdFront, setUploadingIdFront] = useState(false);
  const [uploadingIdBack, setUploadingIdBack] = useState(false);

  const uploadToCloudinary = async (base64Img: string): Promise<string | null> => {
    try {
      const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        Alert.alert("Config Error", "Cloudinary variables missing in .env");
        return null;
      }

      const data = new FormData();
      data.append('file', base64Img);
      data.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: data,
      });

      const json = await response.json();
      return json.secure_url || null;
    } catch (error) {
      return null;
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setUploadingImage(true);
      const url = await uploadToCloudinary(`data:image/jpeg;base64,${result.assets[0].base64}`);
      setUploadingImage(false);
      
      if (url) setProfileImage(url);
      else Alert.alert('Upload Failed', 'Could not upload profile photo.');
    }
  };

  const pickIdImage = async (side: 'front' | 'back') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      side === 'front' ? setUploadingIdFront(true) : setUploadingIdBack(true);
      const url = await uploadToCloudinary(`data:image/jpeg;base64,${result.assets[0].base64}`);
      side === 'front' ? setUploadingIdFront(false) : setUploadingIdBack(false);
      
      if (url) {
        side === 'front' ? setIdDocumentFront(url) : setIdDocumentBack(url);
      } else {
        Alert.alert('Upload Failed', 'Could not upload ID document.');
      }
    }
  };

  const handleSave = async () => {
    if (!token) return;
    if (!name.trim()) {
      Alert.alert('Error', 'Full Name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await profileAPI.update(token, {
        name,
        email,
        address,
        profileImage: profileImage || undefined,
        idType,
        idNumber,
        idDocumentFront: idDocumentFront || undefined,
        idDocumentBack: idDocumentBack || undefined,
      });

      if (response.success) {
        // Update local context
        const updatedUser = { 
          ...user, 
          name, email, address, profileImage, 
          idType, idNumber, idDocumentFront, idDocumentBack 
        };
        await login(token, updatedUser);
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color="#2F2E2E" />
          </TouchableOpacity>

          <Text style={styles.title}>Personal Details</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
          {/* AVATAR SECTION */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {uploadingImage ? (
                <View style={styles.avatarPlaceholder}>
                  <ActivityIndicator size="small" color="#000000" />
                </View>
              ) : profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.avatar} 
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color="rgba(0,0,0,0.3)" />
                </View>
              )}
              <TouchableOpacity style={styles.editBadge} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
          </View>

          {/* INPUT CARD */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Contact Information</Text>
            <InputField label="Full Name" value={name} onChange={setName} />
            <InputField label="Email" value={email} onChange={setEmail} />
            <InputField label="Phone Number" value={phone} onChange={setPhone} />
            <InputField label="Address" value={address} onChange={setAddress} />
          </View>

          {/* ID VERIFICATION CARD */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Identity Verification</Text>
            
            <InputField label="ID Type (e.g., Aadhaar Card)" value={idType} onChange={setIdType} />
            <InputField label="ID Number" value={idNumber} onChange={setIdNumber} />
            
            <View style={styles.idUploadContainer}>
              <View style={styles.idUploadBox}>
                <Text style={styles.idUploadLabel}>Front Side</Text>
                <TouchableOpacity style={styles.idUploadBtn} onPress={() => pickIdImage('front')}>
                  {uploadingIdFront ? <ActivityIndicator color="#000000" /> : 
                   idDocumentFront ? <Image source={{uri: idDocumentFront}} style={styles.idImage} /> :
                   <Ionicons name="camera-outline" size={24} color="rgba(0,0,0,0.3)" />}
                </TouchableOpacity>
              </View>

              <View style={styles.idUploadBox}>
                <Text style={styles.idUploadLabel}>Back Side</Text>
                <TouchableOpacity style={styles.idUploadBtn} onPress={() => pickIdImage('back')}>
                  {uploadingIdBack ? <ActivityIndicator color="#000000" /> : 
                   idDocumentBack ? <Image source={{uri: idDocumentBack}} style={styles.idImage} /> :
                   <Ionicons name="camera-outline" size={24} color="rgba(0,0,0,0.3)" />}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* SAVE BUTTON */}
          <TouchableOpacity 
            style={[styles.saveButton, saving && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

/* ---------- INPUT COMPONENT ---------- */

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={styles.input}
        placeholder={label}
        placeholderTextColor="rgba(0,0,0,0.4)"
      />
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFECEC',
    paddingHorizontal: 20,
  },

  header: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    color: '#2F2E2E',
  },

  card: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 20,
  },

  cardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#2F2E2E',
    marginBottom: 16,
  },

  inputWrapper: {
    marginBottom: 18,
  },

  inputLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#2F2E2E',
    marginBottom: 6,
  },

  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 14,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#2F2E2E',
    backgroundColor: '#FFFFFF',
  },

  saveButton: {
    marginTop: 30,
    height: 50,
    borderRadius: 30,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  saveText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },

  /* AVATAR SECTION */
  avatarSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EFECEC',
  },
  changePhotoText: {
    marginTop: 12,
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#2F2E2E',
  },
  idUploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  idUploadBox: {
    width: '48%',
  },
  idUploadLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  idUploadBtn: {
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
  },
  idImage: {
    width: '100%',
    height: '100%',
  },
});
