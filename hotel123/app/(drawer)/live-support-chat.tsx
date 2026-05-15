import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
  Pressable,
  Linking,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { helpAPI, servicesAPI } from '../../services/api';
// Assuming 'toast' is a custom implementation or imported from a library like 'react-native-toast-message'
// import Toast from 'react-native-toast-message'; // Example import if using a toast library

import { ratingsAPI } from '../../services/api';

export default function LiveSupportChat() {
  const { bookingId, serviceId, isService, hotelName, propertyId, hotelPhone, staffName } = useLocalSearchParams();
  const { token, user } = useAuth();
  
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([
    { id: '1', text: 'Hello! How can I help you with your booking at ' + (hotelName || 'this hotel') + '?', sender: 'bot', time: '10:00 AM' }
  ]);
  const [loading, setLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [exitVisible, setExitVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadTicket();
    const interval = setInterval(loadTicket, 5000);

    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
    });

    return () => {
      clearInterval(interval);
      showSubscription.remove();
    };
  }, []);

  const loadTicket = async () => {
    if (!token) return;
    try {
      if (isService === 'true' && serviceId) {
        const res = await servicesAPI.getById(token, serviceId as string);
        if (res.success && res.request) {
           setActiveRequest(res.request);
           const formattedMsgs = (res.request.messages || []).map((m: any) => ({
             id: m.id,
             text: m.content,
             senderType: m.senderId === user?.id ? 'GUEST' : 'STAFF', // Use consistent senderType
             time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
           }));
           const welcomeMsg = { id: 'welcome', text: 'Hello! I am assigned to your request: ' + (res.request.title) + '. How can I help?', senderType: 'STAFF', time: '10:00 AM' };
           
           setMessages(prev => {
             // De-duplicate by ID or by matching content/time for optimistic messages
             const existingIds = new Set(prev.map(m => m.id));
             
             const newMsgs = [welcomeMsg, ...formattedMsgs].filter(m => {
               // If ID already exists, skip
               if (existingIds.has(m.id)) return false;
               return true;
             });

             if (newMsgs.length === 0) return prev;

             // Remove optimistic messages that are now confirmed by server (matched by text)
             const filteredPrev = prev.filter(p => !formattedMsgs.find(m => m.text === p.text && p.id.toString().startsWith('user-')));
             return [...filteredPrev, ...newMsgs];
           });
        }
        return;
      }

      const res = await helpAPI.getMyTickets(token);
      if (res.success && res.tickets) {
        const ticket = res.tickets.find((t: any) => t.subject.includes(bookingId as string || 'General') && t.status !== 'CLOSED');
          if (ticket) {
            setActiveTicket(ticket);
            const formattedMsgs = ticket.messages.map((m: any) => ({
               id: m.id,
               text: m.content,
               senderType: m.senderRole === 'GUEST' ? 'GUEST' : 'STAFF',
               time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
            
            setMessages(prev => {
              const existingIds = new Set(prev.map(m => m.id));
              const newMsgs = formattedMsgs.filter(m => !existingIds.has(m.id));
              
              if (newMsgs.length === 0) return prev;
              
              // Filter out optimistic messages already sent
              const filteredPrev = prev.filter(p => !formattedMsgs.find(m => m.text === p.text && p.id.toString().startsWith('user-')));
              return [...filteredPrev, ...newMsgs];
            });
          }
      }
    } catch (err) {
      console.error('Load ticket error:', err);
    }
  };

  const submitRating = async () => {
    if (rating === 0 || !token || !serviceId) return;
    try {
      setLoading(true);
      const res = await ratingsAPI.submit(token, {
        serviceRequestId: serviceId as string,
        rating,
      });
      if (res.success) {
        setRatingSubmitted(true);
        Alert.alert('Thank You!', 'Your feedback helps us improve.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !token) return;

    const currentMsg = message;
    setMessage('');
    
    // Optimistically add user message to UI
    const userMsg = {
      id: 'user-' + Date.now(),
      text: currentMsg,
      senderType: 'GUEST',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    
    try {
      if (isService === 'true' && serviceId) {
        const { servicesAPI } = require('../../services/api');
        await servicesAPI.sendMessage(token, serviceId as string, currentMsg);
        loadTicket();
        return;
      }

      if (activeTicket) {
        // Add message to existing support ticket
        await helpAPI.addMessage(token, activeTicket.id, currentMsg);
      } else {
        // Create new support ticket linked to this hotel/booking
        const isGeneral = bookingId === 'General' || !bookingId;
        const res = await helpAPI.createTicket(token, {
          type: 'BOOKING',
          subject: isGeneral
            ? `Support Request from ${user?.name || 'Guest'}`
            : `Support for Booking #${bookingId}`,
          message: currentMsg,
          propertyId: propertyId as string || undefined,
          priority: 'NORMAL'
        });
        if (res.success) {
          setActiveTicket(res.ticket);
        }
      }
      loadTicket();

      // Auto-reply based on keywords
      const lowerMsg = currentMsg.toLowerCase();
      let botResponse = '';
      if (lowerMsg.includes('hi') || lowerMsg.includes('hello')) {
        botResponse = "Hello! I've notified our support team. How can I assist you today?";
      } else if (lowerMsg.includes('booking') || lowerMsg.includes('check')) {
        botResponse = "I see your query is about your booking. Our agent will respond shortly.";
      } else if (lowerMsg.includes('payment') || lowerMsg.includes('refund')) {
        botResponse = "For payment queries, our billing specialist will respond shortly.";
      } else if (!activeTicket) {
        botResponse = "Your support ticket has been created. A representative will join the chat soon.";
      }

      if (botResponse) {
        setTimeout(() => {
          setMessages(prev => {
            if (prev.find(m => m.text === botResponse)) return prev;
            return [...prev, {
              id: 'bot-' + Date.now(),
              text: botResponse,
              senderType: 'STAFF',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }];
          });
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }, 1500);
      }
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      {/* 🔥 ENTIRE SCREEN INSIDE KAV */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 90}
      >

        <View style={[styles.container, { paddingTop: insets.top }]}>

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => router.back()} style={styles.chatBackBtn}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View>
                <Text style={styles.headerTitle}>Live Support</Text>
                <View style={styles.statusRow}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.statusText}>Support Active</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={() => setExitVisible(true)}>
              <Text style={styles.exitText}>End</Text>
            </TouchableOpacity>
          </View>

          {/* CHAT + INPUT AREA */}
          <View style={{ flex: 1 }}>

            <ScrollView
              ref={scrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={styles.chatBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

              {/* BOOKING CARD */}
              <View style={styles.bookingCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.bookingTitle}>{hotelName || 'Hotel Name'}</Text>
                  <View style={styles.greenBadge}>
                    <Text style={styles.badgeText}>Booking #{bookingId?.toString().slice(-6).toUpperCase()}</Text>
                  </View>
                </View>

                <Text style={styles.gray}>Issue regarding your recent stay</Text>
                <View style={styles.divider} />
                <View style={styles.rowBetween}>
                  <Text style={styles.bold}>Guest: {user?.name || 'Harsh Vardhan'}</Text>
                  <TouchableOpacity onPress={() => {
                    const phone = hotelPhone as string;
                    if (phone) {
                      Linking.openURL(`tel:${phone}`);
                    } else {
                      Linking.openURL('tel:+911800000000');
                    }
                  }}>
                    <Text style={styles.callHotel}>Call Hotel</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* MESSAGES */}
              {messages.map((m) => (
                <View key={m.id} style={[
                  styles.messageWrapper,
                  m.senderType === 'GUEST' ? styles.userBubble : styles.botBubble
                ]}>
                  <Text style={m.senderType === 'GUEST' ? styles.userText : styles.botText}>
                    {m.text}
                  </Text>
                  <Text style={styles.time}>{m.time}</Text>
                </View>
              ))}

            </ScrollView>

            {/* ✅ CONDITIONAL BOTTOM BAR: RATING OR INPUT */}
            {(activeRequest?.status === 'COMPLETED' && !ratingSubmitted) ? (
              <View style={[styles.ratingBar, { paddingBottom: Math.max(12, insets.bottom) }]}>
                <Text style={styles.ratingTitle}>Rate your experience with {staffName || 'Staff'}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                      <Ionicons 
                        name={s <= rating ? "star" : "star-outline"} 
                        size={32} 
                        color={s <= rating ? "#FFD700" : "#888"} 
                        style={{ marginHorizontal: 5 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity 
                  style={[styles.submitRatingBtn, { opacity: rating === 0 ? 0.6 : 1 }]} 
                  onPress={submitRating}
                  disabled={rating === 0}
                >
                  <Text style={styles.submitRatingText}>Submit Rating</Text>
                </TouchableOpacity>
              </View>
            ) : ratingSubmitted ? (
               <View style={[styles.ratingBar, { paddingBottom: Math.max(12, insets.bottom) }]}>
                 <Text style={styles.ratingTitle}>Thank you for your feedback! ✨</Text>
               </View>
            ) : (
              <View style={[styles.inputBar, { paddingBottom: Math.max(12, insets.bottom) }]}>
                <TextInput
                  placeholder="Message..."
                  value={message}
                  onChangeText={setMessage}
                  style={styles.input}
                  onSubmitEditing={sendMessage}
                />

                <TouchableOpacity 
                  onPress={sendMessage}
                  disabled={!message.trim()}
                >
                  <Ionicons 
                    name="send" 
                    size={22} 
                    color={message.trim() ? "#FFF" : "rgba(255,255,255,0.3)"} 
                  />
                </TouchableOpacity>
              </View>
            )}

          </View>

          {/* EXIT MODAL */}
          <Modal transparent visible={exitVisible} animationType="slide">
            <Pressable
              style={styles.overlay}
              onPress={() => setExitVisible(false)}
            />

            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>Leaving? Tell us why.</Text>
              <Text style={styles.sheetSub}>
                This will help us serve you better
              </Text>

              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => {
                  setExitVisible(false);
                  router.replace('/home');
                }}
              >
                <Text style={styles.sheetLink}>My Query is resolved</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => {
                  setExitVisible(false);
                  Linking.openURL('mailto:hotel@gmail.com');
                }}
              >
                <Text style={styles.sheetLink}>My Query is not resolved</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => {
                  setExitVisible(false);
                  router.replace('/help');
                }}
              >
                <Text style={styles.sheetLink}>Restart the Chat</Text>
              </TouchableOpacity>
            </View>
          </Modal>

        </View>

      </KeyboardAvoidingView>
    </>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F4' },

  header: {
    height: 80, // Reduced from 100 since we handle padding top manually
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatBackBtn: {
    marginRight: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },

  exitText: { color: '#fff', fontSize: 14, fontFamily: 'Inter-SemiBold', opacity: 0.9 },

  chatBody: {
    padding: 16,
    paddingBottom: 12,
  },

  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
  },

  bookingTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold' },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    alignItems: 'center',
  },

  gray: { color: '#888', fontSize: 13 },

  bold: { fontSize: 14, fontFamily: 'Inter-SemiBold' },

  price: { fontSize: 16, fontFamily: 'Inter-SemiBold' },

  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 12,
  },

  greenBadge: {
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  lightGreenBadge: {
    backgroundColor: '#DFF0D8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },

  badgeText: { color: '#2E7D32', fontSize: 12 },

  callHotel: {
    textAlign: 'center',
    color: '#1E6BFF',
    marginTop: 10,
    fontSize: 14,
  },

  botBubble: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignSelf: 'flex-start',
    maxWidth: '85%',
    elevation: 2,
  },

  userBubble: {
    backgroundColor: '#DCEAFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },

  botText: { fontSize: 14 },
  userText: { fontSize: 14 },

  time: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 6,
  },

  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },

  optionTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 10,
  },

  optionLink: {
    color: '#1E6BFF',
    fontSize: 14,
    marginTop: 6,
  },

  inputBar: {
    backgroundColor: '#2F2E2E',
    padding: 12,
    paddingBottom: 24, // Fallback
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: '#000',
    fontFamily: 'Inter-Regular',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  ratingBar: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#eee',
    elevation: 10,
  },
  ratingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  submitRatingBtn: {
    backgroundColor: '#2F2E2E',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
  },
  submitRatingText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },

  sheet: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  sheetTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },

  sheetSub: {
    color: '#777',
    marginVertical: 6,
  },

  sheetItem: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
  },

  sheetLink: {
    color: '#1E6BFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
