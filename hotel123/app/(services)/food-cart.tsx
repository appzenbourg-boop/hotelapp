import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';

import { useAuth } from '../../context/AuthContext';
import { servicesAPI, bookingsAPI } from '../../services/api';

export default function FoodCart() {
  const params = useLocalSearchParams();
  const initialCart = params.cart ? JSON.parse(params.cart as string) : {};
  const menuItems = params.menu ? JSON.parse(params.menu as string) : [];

  const [cart, setCart] = useState<any>(initialCart);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const increase = (id: string) => {
    setCart({ ...cart, [id]: (cart[id] || 0) + 1 });
  };

  const decrease = (id: string) => {
    if (cart[id] > 1) {
      setCart({ ...cart, [id]: cart[id] - 1 });
    } else {
      const updated = { ...cart };
      delete updated[id];
      setCart(updated);
    }
  };

  const getMenuItem = (id: string) => menuItems.find((i: any) => i.id === id);

  const totalItemsCount = Object.values(cart).reduce((sum: number, val: any) => sum + val, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = getMenuItem(id);
    return sum + (item ? item.price * (qty as number) : 0);
  }, 0);

  const handleOrder = async (paymentType: string) => {
    if (!token) return;
    try {
      setLoading(true);
      const bookingRes = await bookingsAPI.getActive(token);
      if (bookingRes.success && bookingRes.bookings && bookingRes.bookings.length > 0) {
        const booking = bookingRes.bookings[0];
        const orderItems = Object.entries(cart).map(([id, qty]) => {
          const item = getMenuItem(id);
          return { name: item?.name, qty, price: item?.price };
        });

        const res = await servicesAPI.orderFood(
          token,
          booking.roomId,
          orderItems,
          totalPrice
        );

        if (res.success) {
          const orderId = res.request?.id || res.id;
          router.replace({
            pathname: '/(services)/food-success',
            params: { serviceId: orderId }
          });
        } else {
          Alert.alert('Error', 'Failed to place order.');
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        <ImageBackground source={require('../../assets/images/food-header.png')} style={styles.headerImg}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
        </ImageBackground>

        <View style={styles.sheet}>
          <ScrollView>
            {Object.entries(cart).map(([id, qty]: [string, any]) => {
              const item = getMenuItem(id);
              if (!item) return null;
              return (
                <CartRow
                  key={id}
                  name={item.name}
                  price={item.price}
                  qty={qty}
                  image={item.image}
                  onAdd={() => increase(id)}
                  onRemove={() => decrease(id)}
                />
              );
            })}

            {totalItemsCount === 0 && (
              <Text style={{ textAlign: 'center', marginTop: 100, color: '#666' }}>Your cart is empty</Text>
            )}

            {totalItemsCount > 0 && (
              <>
                <Text style={styles.paymentTitle}>Payment Methods</Text>
                <PaymentBar label="Pay Online" total={totalPrice} onPress={() => router.push('/(services)/extend-payment')} />
                <PaymentBar label="Add to Final Bill" total={totalPrice} onPress={() => handleOrder('BILL')} />
                <PaymentBar label="Pay Using Cash" total={totalPrice} onPress={() => handleOrder('CASH')} />
              </>
            )}
          </ScrollView>
        </View>

        {loading && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#2F2E2E" />
          </View>
        )}
      </View>
    </>
  );
}

/* ---------------- COMPONENTS ---------------- */

function CartRow({ name, price, qty, image, onAdd, onRemove }: any) {
  return (
    <View style={styles.cartRow}>

      <View style={{ flex: 1 }}>
        <Text style={styles.foodName}>{name}</Text>
        <Text style={styles.foodPrice}>₹{price}</Text>
        <Text style={styles.foodDesc}>( Freshly prepared for you )</Text>
      </View>

      <View style={styles.rightBox}>
        <Image
          source={image ? { uri: image } : require('../../assets/images/food-item.png')}
          style={styles.cartImg}
        />

        <View style={styles.qtyBox}>
          <TouchableOpacity onPress={onRemove}>
            <Ionicons name="remove" size={16} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.qtyText}>{qty}</Text>

          <TouchableOpacity onPress={onAdd}>
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

function PaymentBar({ label, total, onPress }: any) {
  return (
    <View style={styles.payBar}>

      <View>
        <Text style={styles.paySmall}>Total Amount</Text>
        <Text style={styles.payTotal}>₹{total.toFixed(2)}</Text>
      </View>

      <TouchableOpacity style={styles.payBtn} onPress={onPress}>
        <Text style={styles.payBtnText}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} />
      </TouchableOpacity>

    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F1EE' },

  headerImg: {
    height: 260,
    padding: 20,
    justifyContent: 'space-between',
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
    padding: 16,
  },

  cartRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#CFCFCF',
  },

  foodName: { fontSize: 16, fontFamily: 'Inter-Regular' },
  foodPrice: { marginTop: 4 },
  foodDesc: { marginTop: 4, fontSize: 12, color: '#777' },

  rightBox: { alignItems: 'center' },

  cartImg: {
    width: 90,
    height: 70,
    borderRadius: 12,
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

  qtyText: { color: '#fff', marginHorizontal: 10 },

  paymentTitle: {
    marginVertical: 20,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'Inter-SemiBold',
  },

  payBar: {
    backgroundColor: '#2F2E2E',
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  paySmall: { color: '#BDBDBD', fontSize: 12 },
  payTotal: { color: '#fff', fontSize: 16, fontFamily: 'Inter-SemiBold' },

  /* 🔥 Equal width buttons */
  payBtn: {
    width: 190,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  payBtnText: {
    marginRight: 4,
    fontFamily: 'Inter-SemiBold',
  },
});
