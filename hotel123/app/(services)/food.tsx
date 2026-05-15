import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { Skeleton } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { menuAPI, bookingsAPI } from '../../services/api';

export default function FoodScreen() {
  const insets = useSafeAreaInsets();
  const [cart, setCart] = useState<any>({});
  const { token } = useAuth();

  const fetchMenu = async () => {
    if (!token) return [];
    try {
      let propertyId = null;
      const bookingRes = await bookingsAPI.getActive(token);
      if (bookingRes.success && bookingRes.bookings?.length > 0) {
        propertyId = bookingRes.bookings[0].room?.propertyId || bookingRes.bookings[0].propertyId;
      } else {
        const allRes = await bookingsAPI.getMyBookings(token);
        const array = Array.isArray(allRes) ? allRes : (allRes?.value || []);
        if (array.length > 0) propertyId = array[0].propertyId;
      }
      
      if (!propertyId) propertyId = "69e531fc66a1b1601c0af5d2";
      
      const res = await menuAPI.getAll({ propertyId });
      return Array.isArray(res) ? res : (res?.menuItems || res?.value || []);
    } catch (e) {
      console.error("Failed to fetch menu:", e);
      return [];
    }
  };

  const { data: menuItems = [], isLoading: loading } = useSWR(
    token ? ['food_menu', token] : null,
    fetchMenu
  );

  const increase = (id: string) => {
    const next = { ...cart };
    next[id] = (next[id] || 0) + 1;
    setCart(next);
  };

  const decrease = (id: string) => {
    const next = { ...cart };
    if (next[id] > 0) {
      next[id] -= 1;
      if (next[id] === 0) delete next[id];
      setCart(next);
    }
  };

  const totalItems = Object.values(cart).reduce(
    (sum: number, val: any) => sum + val,
    0
  );

  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menuItems.find(i => i.id === id);
    return sum + (item ? item.price * (qty as number) : 0);
  }, 0);

  const categories = [...new Set(menuItems.map(i => i.category))];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>

        {/* HEADER */}
        <ImageBackground
          source={require('../../assets/images/food-header.png')}
          style={[styles.headerImg, { height: 260 + insets.top, paddingTop: 10 + insets.top }]}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color="#000" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Menu</Text>
        </ImageBackground>

        {/* BODY */}
        <View style={styles.sheet}>
          {loading && menuItems.length === 0 ? (
            <View style={{ gap: 20, paddingHorizontal: 4 }}>
               {[1, 2, 3].map(i => (
                 <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
                    <View style={{ flex: 1, gap: 8 }}>
                       <Skeleton width="70%" height={20} />
                       <Skeleton width="40%" height={15} />
                       <Skeleton width="90%" height={40} />
                    </View>
                    <Skeleton width={100} height={100} borderRadius={15} />
                 </View>
               ))}
            </View>
          ) : (
            <ScrollView 
              contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
              showsVerticalScrollIndicator={false}
            >
              {categories.map((cat) => (
                <View key={cat}>
                  <Section title={cat} />
                  {menuItems.filter(i => i.category === cat).map(item => (
                    <FoodRow
                      key={item.id}
                      name={item.name}
                      price={item.price}
                      desc={item.description}
                      image={item.image}
                      qty={cart[item.id] || 0}
                      onAdd={() => increase(item.id)}
                      onRemove={() => decrease(item.id)}
                    />
                  ))}
                </View>
              ))}

              {menuItems.length === 0 && !loading && (
                <Text style={{ textAlign: 'center', marginTop: 100, color: '#666' }}>No menu items available at this property.</Text>
              )}
            </ScrollView>
          )}
        </View>

        {/* CART BAR */}
        {totalItems > 0 && (
          <View style={[styles.cartBar, { bottom: Math.max(20, insets.bottom + 10) }]}>
            <View>
              <Text style={styles.cartSmall}>{totalItems} item{totalItems > 1 ? 's' : ''} added</Text>
              <Text style={styles.cartPrice}>₹{totalPrice.toFixed(2)} total</Text>
            </View>

            <TouchableOpacity
              style={styles.viewCartBtn}
              onPress={() =>
                router.push({
                  pathname: '/(services)/food-cart',
                  params: {
                    cart: JSON.stringify(cart),
                    menu: JSON.stringify(menuItems)
                  },
                })
              }
            >
              <Text style={styles.viewCartText}>View Cart</Text>
              <Ionicons name="chevron-forward" size={18} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Section({ title }: any) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function FoodRow({ name, price, desc, image, qty, onAdd, onRemove }: any) {
  return (
    <View style={styles.foodRow}>

      <View style={{ flex: 1 }}>
        <Text style={styles.foodName}>{name}</Text>
        <Text style={styles.foodPrice}>₹{price}</Text>
        <Text style={styles.foodDesc}>
          {desc || '( No description available )'}
        </Text>
      </View>

      <View style={styles.imageWrap}>
        <Image
          source={image ? { uri: image } : require('../../assets/images/food-item.png')}
          style={styles.foodImg}
        />

        {qty === 0 ? (
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
            <Text style={styles.addText}>ADD</Text>
            <Ionicons name="add" size={14} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyBox}>
            <TouchableOpacity onPress={onRemove}>
              <Ionicons name="remove" size={16} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.qtyText}>{qty}</Text>

            <TouchableOpacity onPress={onAdd}>
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

      </View>

    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F1EE' },

  headerImg: {
    justifyContent: 'space-between',
    padding: 20,
  },

  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    alignSelf: 'center',
    fontSize: 26,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    marginBottom: 30,
  },

  sheet: {
    flex: 1,
    backgroundColor: '#ECE9E6',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -30,
    paddingTop: 20,
    paddingHorizontal: 16,
  },

  sectionHeader: {
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#BDBDBD',
  },

  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },

  foodRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#CFCFCF',
  },

  foodName: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },

  foodPrice: {
    marginTop: 4,
    fontSize: 14,
  },

  foodDesc: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
  },

  imageWrap: {
    width: 120,
    alignItems: 'center',
  },

  foodImg: {
    width: 90,
    height: 70,
    borderRadius: 12,
  },

  addBtn: {
    marginTop: -14,
    backgroundColor: '#3B3B3B',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  addText: {
    color: '#fff',
    fontSize: 12,
    marginRight: 4,
  },

  qtyBox: {
    marginTop: -14,
    backgroundColor: '#3B3B3B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  qtyText: {
    color: '#fff',
    marginHorizontal: 10,
    fontSize: 14,
  },

  cartBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#2F2E2E',
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cartSmall: {
    color: '#BDBDBD',
    fontSize: 12,
  },

  cartPrice: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },

  viewCartBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  viewCartText: {
    marginRight: 4,
    fontFamily: 'Inter-SemiBold',
  },
});
