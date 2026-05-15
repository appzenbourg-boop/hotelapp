import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export default function ListProperty() {
  const insets = useSafeAreaInsets();


  const [step, setStep] = useState<Step>(1);
  const [propertyType, setPropertyType] =
    useState<'hotel' | 'home' | null>(null);

  const [floors, setFloors] = useState(1);
  const [rooms, setRooms] = useState('');
  const [phone, setPhone] = useState('');
  const [facilities, setFacilities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);

  const toggleFacility = (item: string) => {
    setFacilities(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const canContinueStep5 = rooms.length > 0 && phone.length === 10;
  const canContinueStep6 = facilities.length > 0;
  const canFinish = images.length > 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>


        {/* HEADER */}
        {step < 8 && (
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() =>
                step === 1 ? router.back() : setStep((s) => (s - 1) as Step)
              }
            >
              <Ionicons name="chevron-back" size={26} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Property</Text>
          </View>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <Text style={styles.title}>
              What type of property do you want to list?
            </Text>

            <OptionCard
              title="Hotel"
              subtitle="A business that allows guests to book private rooms, suites etc"
              onPress={() => {
                setPropertyType('hotel');
                setStep(2);
              }}
            />

            <OptionCard
              title="Home"
              subtitle="A residential home where guests may book one or more rooms, or entire property"
              onPress={() => {
                setPropertyType('home');
                setStep(2);
              }}
            />
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <Text style={styles.title}>
              Are you at your property's location right now?
            </Text>

            <OptionCard
              title="Yes! I am at my property right now."
              subtitle="Please allow access to your current location"
              onPress={() => setStep(4)}
            />

            <OptionCard
              title="No! I’m not at my property right now."
              subtitle="You can search for your property's location in the next step"
              onPress={() => setStep(3)}
            />
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <Text style={styles.title}>
              Search for your property's address
            </Text>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#777" />
              <TextInput
                placeholder="Search by street / area / locality"
                style={styles.searchInput}
              />
              <Ionicons name="close" size={18} color="#777" />
            </View>

            <TouchableOpacity onPress={() => setStep(4)}>
              <Text style={styles.manualText}>
                Enter the address manually
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

            <Text style={styles.title}>Your address matters!</Text>

            <Input label="Property's Name" />
            <Input label="City" />
            <Input label="Flat, Suite number (Optional)" />
            <Input label="Street/Area/Locality" />
            <Input label="Postal Code (Optional)" />
            <Input label="State" value="Delhi" />
            <Input label="Country" value="India" />

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => setStep(5)}
            >
              <Text style={styles.confirmText}>Confirm Address</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>


            <Text style={styles.title}>Property Information</Text>

            <Text style={styles.label}>Number of floors</Text>

            <View style={styles.counterRow}>
              <TouchableOpacity onPress={() => setFloors(Math.max(1, floors - 1))}>
                <Text style={styles.counterBtn}>-</Text>
              </TouchableOpacity>

              <Text style={styles.counterValue}>{floors}</Text>

              <TouchableOpacity onPress={() => setFloors(floors + 1)}>
                <Text style={styles.counterBtn}>+</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Number of rooms"
              value={rooms}
              onChangeText={setRooms}
              keyboardType="numeric"
            />

            <Input
              label="Front desk phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="numeric"
              maxLength={10}
            />

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                !canContinueStep5 && { opacity: 0.5 },
              ]}
              disabled={!canContinueStep5}
              onPress={() => setStep(6)}
            >
              <Text style={styles.confirmText}>Continue</Text>
            </TouchableOpacity>

          </ScrollView>
        )}

        {/* STEP 6 */}
        {step === 6 && (
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>


            <Text style={styles.title}>Facilities in your property</Text>

            {['Breakfast','Elevator','AC','Free Wifi','CCTV','Power Backup']
              .map(item => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.facilityChip,
                    facilities.includes(item) && styles.facilityActive,
                  ]}
                  onPress={() => toggleFacility(item)}
                >
                  <Text>{item}</Text>
                </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                !canContinueStep6 && { opacity: 0.5 },
              ]}
              disabled={!canContinueStep6}
              onPress={() => setStep(7)}
            >
              <Text style={styles.confirmText}>Next</Text>
            </TouchableOpacity>

          </ScrollView>
        )}

        {/* STEP 7 */}
        {step === 7 && (
          <>
            <Text style={styles.title}>Add Property Images</Text>

            <View style={styles.uploadBox}>
              <TouchableOpacity onPress={pickImage}>
                <Ionicons name="add" size={32} />
                <Text>Upload Photos</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal>
              {images.map((img, i) => (
                <Image key={i} source={{ uri: img }} style={styles.preview} />
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                !canFinish && { opacity: 0.5 },
              ]}
              disabled={!canFinish}
              onPress={() => setStep(8)}
            >
              <Text style={styles.confirmText}>Finish</Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 8 */}
        {step === 8 && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={90} color="#22C55E" />
            <Text style={styles.successTitle}>Submitted Successfully</Text>
            <Text style={styles.successText}>
              Our team will contact you soon for further verification.
            </Text>
          </View>
        )}

      </View>
    </>
  );
}

/* COMPONENTS */

function OptionCard({ title, subtitle, onPress }: any) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function Input({ label, value, onChangeText, keyboardType, maxLength }: any) {
  return (
    <View style={styles.inputBox}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
    </View>
  );
}

/* STYLES */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  headerTitle: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: '600',
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },

  subTitle: {
    color: '#666',
    marginBottom: 20,
  },

  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  cardSub: {
    marginTop: 6,
    color: '#666',
  },

  searchBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 30,
    paddingHorizontal: 14,
    height: 50,
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    marginHorizontal: 10,
  },

  manualText: {
    marginTop: 24,
    color: '#2563EB',
    fontWeight: '600',
  },

  inputBox: {
    marginBottom: 16,
  },

  label: {
    marginBottom: 6,
    color: '#555',
  },

  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
  },

  confirmBtn: {
    marginVertical: 30,
    backgroundColor: '#2563EB',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  confirmText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },

  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  counterBtn: {
    fontSize: 26,
    paddingHorizontal: 20,
  },

  counterValue: {
    fontSize: 18,
  },

  facilityChip: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },

  facilityActive: {
    backgroundColor: '#E5F0FF',
    borderColor: '#2563EB',
  },

  uploadBox: {
    height: 160,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  preview: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 10,
    marginTop: 10,
  },

  successBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  successTitle: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: '700',
  },

  successText: {
    marginTop: 10,
    color: '#666',
    textAlign: 'center',
  },

});
