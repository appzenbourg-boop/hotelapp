import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { hotelAPI } from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';

export default function SearchScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const t = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [allHotels, setAllHotels] = useState<any[]>([]);

    useEffect(() => {
        fetchAllHotels();
    }, []);

    const fetchAllHotels = async () => {
        try {
            setLoading(true);
            const res = await hotelAPI.getAll();
            setAllHotels(Array.isArray(res) ? res : []);
            setResults(Array.isArray(res) ? res : []);
        } catch (error) {
            console.error('Error fetching hotels:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.trim()) {
                performSearch(searchQuery);
            } else {
                setResults(allHotels);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, allHotels]);

    const performSearch = async (query: string) => {
        try {
            setLoading(true);
            const res = await hotelAPI.getAll({ search: query });
            setResults(Array.isArray(res) ? res : []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderHotelItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({
                pathname: '/(main)/hotel-details',
                params: { propertyId: item.id, propertyName: item.name }
            })}
        >
            <Image
                source={item.images?.[0] ? { uri: item.images[0] } : require('../../assets/images/image5.png')}
                style={styles.cardImg}
            />
            <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                    <Text style={styles.hotelName}>{item.name}</Text>
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#FFA000" />
                        <Text style={styles.ratingText}>4.9</Text>
                    </View>
                </View>
                <Text style={styles.locationText}>{item.address}</Text>
                <Text style={styles.description}>{item.description?.slice(0, 80)}...</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        placeholder={t('searchPlaceholder') || 'Search hotels...'}
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                        autoFocus
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#000" />
                </View>
            ) : results.length > 0 ? (
                <FlatList
                    data={results}
                    renderItem={renderHotelItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.centerBox}>
                    <Ionicons name="business-outline" size={60} color="#DDD" />
                    <Text style={styles.emptyText}>No hotels found</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
    backButton: { marginRight: 12 },
    searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', height: 45, borderRadius: 25, paddingHorizontal: 15 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter-Regular', color: '#000', minHeight: 40, paddingVertical: 8 },
    
    listContent: { padding: 16, paddingBottom: 100 },
    card: { backgroundColor: '#FFF', borderRadius: 20, marginBottom: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardImg: { width: '100%', height: 180 },
    cardInfo: { padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    hotelName: { fontSize: 17, fontFamily: 'Inter-Bold', color: '#1A1A1A', flex: 1 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9E5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    ratingText: { marginLeft: 4, fontSize: 12, fontFamily: 'Inter-Bold', color: '#FFA000' },
    locationText: { fontSize: 13, color: '#666', marginBottom: 8 },
    description: { fontSize: 12, color: '#999', lineHeight: 18 },

    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { marginTop: 16, fontSize: 16, color: '#999', fontFamily: 'Inter-Medium' }
});
