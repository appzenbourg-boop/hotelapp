// Mobile App API Service
// Complete API integration with Zenbourg Admin Backend

import { Alert } from 'react-native';
import { mutate as globalMutate } from 'swr';
import CacheManager from '../utils/cacheManager';
import { MOCK_HOTELS, filterHotelsByLocation, searchHotels } from './mockHotelData';

// API URL — production Render deployment
// FORCE LOCAL DEV OVERRIDE to bypass Expo environment cache trap
// export const BASE_URL = 'http://192.168.29.72:3000/api';
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://hotel.stayin.in/api';
const USE_MOCK_DATA = false; 

const invalidateData = async (prefix: string, token?: string, revalidate: boolean = true) => {
    // Clear local CacheManager
    await CacheManager.clearByPrefix(prefix);
    await CacheManager.clearByPrefix(`my_${prefix}`);
    
    // Clear Global SWR (this forces hooks to re-fetch)
    globalMutate(
        (key: any) => {
            if (Array.isArray(key)) {
                return key[0] === prefix || key[0] === `my_${prefix}` || (prefix === 'bookings' && key[0] === 'bookings_list');
            }
            return typeof key === 'string' && (key.startsWith(prefix) || key.startsWith(`my_${prefix}`));
        },
        undefined,
        { revalidate }
    );
};

export const apiCall = async (endpoint: string, options: any = {}) => {
    const { method = 'GET', body, token } = options;

    const headers: any = {
        'Content-Type': 'application/json',
    };

    if (token && typeof token === 'string' && token.length > 5) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log(`[API Auth] Using token: ${token.substring(0, 15)}...`);
    } else {
        console.log(`[API Auth] WARNING: No valid token provided for ${endpoint}`);
    }

    // Ensure no double slashes in URL
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const separator = cleanEndpoint.includes('?') ? '&' : '?';
    const url = `${BASE_URL}${cleanEndpoint}${separator}t=${Date.now()}`;

    console.log(`[API Request] ${method} ${url}`);
    console.log(`[API Headers]`, JSON.stringify(headers));
    if (body) console.log(`[API Body]`, JSON.stringify(body));

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const responseText = await response.text();
        let data: any;

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
            console.error(`[API Parse Error] Could not parse JSON. Response:`, responseText);
            throw new Error(`Server returned invalid response (${response.status})`);
        }

        if (!response.ok) {
            console.error(`[API Error Response]`, data);
            if (response.status === 401) {
                console.log('⚠️ Unauthorized! Clearing token and redirecting...');
                try {
                   const { router } = require('expo-router');
                   router.replace('/(auth)/sign-in');
                } catch (e) {}
            }
            throw new Error(data.error || data.message || `Error ${response.status}: ${response.statusText}`);
        }

        return data;
    } catch (error: any) {
        console.error(`[API Network Error] ${method} ${url}:`, error.message);
        if (!options.silent) {
            Alert.alert('Error', error.message || 'Network request failed');
        }
        throw error;
    }
};

// Cached API call wrapper
const cachedApiCall = async (
    endpoint: string,
    options: any = {},
    cacheKey?: string,
    cacheTime: number = 300000 // 5 minutes default
) => {
    const { method = 'GET' } = options;
    
    // Only cache GET requests
    if (method === 'GET' && cacheKey) {
        return CacheManager.getOrFetch(
            cacheKey,
            () => apiCall(endpoint, options),
            cacheTime
        );
    }
    
    // For non-GET requests, invalidate related cache
    if (method !== 'GET' && cacheKey) {
        await CacheManager.remove(cacheKey);
    }
    
    return apiCall(endpoint, options);
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// ========================================
// AUTHENTICATION APIs
// ========================================

export const authAPI = {
    login: async (phone: string, password: string) => {
        return apiCall('/auth/login', {
            method: 'POST',
            body: { phone, password },
        });
    },

    signup: async (name: string, phone: string, password: string, email?: string, referralCode?: string, dob?: string, gender?: string) => {
        return apiCall('/auth/register', {
            method: 'POST',
            body: { name, phone, password, email, referralCode, dob, gender },
        });
    },

    sendOTP: async (phone: string) => {
        return apiCall('/otp/send', {
            method: 'POST',
            body: { phone },
        });
    },

    verifyOTP: async (phone: string, code: string) => {
        return apiCall('/otp/verify', {
            method: 'POST',
            body: { phone, code },
        });
    },

    resetPassword: async (phone: string, password: string, verified: boolean) => {
        return apiCall('/auth/reset-password', {
            method: 'POST',
            body: { phone, password, verified },
        });
    },
};

// ========================================
// PROPERTIES / HOTELS APIs
// ========================================

export const propertyAPI = {
    getAll: async (filters?: { location?: string; search?: string }) => {
        // Use mock data for instant response
        if (USE_MOCK_DATA) {
            const cacheKey = `mock_properties_${filters?.location || ''}_${filters?.search || ''}`;
            
            return CacheManager.getOrFetch(
                cacheKey,
                async () => {
                    // Simulate network delay for realism
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    let hotels = [...MOCK_HOTELS];
                    
                    // Apply location filter
                    if (filters?.location) {
                        hotels = filterHotelsByLocation(filters.location);
                    }
                    
                    // Apply search filter
                    if (filters?.search) {
                        hotels = searchHotels(filters.search);
                    }
                    
                    return hotels;
                },
                600000 // 10 minutes cache
            );
        }
        
        // Backend API call (when USE_MOCK_DATA is false)
        const params = new URLSearchParams();
        if (filters?.location) params.append('location', filters.location);
        if (filters?.search) params.append('search', filters.search);

        const query = params.toString();
        const cacheKey = `properties_${query || 'all'}`;
        
        const data = await cachedApiCall(
            `/properties${query ? `?${query}` : ''}`,
            {},
            cacheKey,
            600000 // 10 minutes cache
        );
        
        // Mocking coordinates since DB doesn't have them yet
        if (Array.isArray(data)) {
            return data.map((hotel: any, index: number) => ({
                ...hotel,
                latitude: hotel.latitude || (28.6139 + (index * 0.01)), // Delhi base + staggered
                longitude: hotel.longitude || (77.2090 + (index * 0.01)),
            }));
        }
        return data;
    },

    getById: async (id: string) => {
        // Use mock data
        if (USE_MOCK_DATA) {
            const cacheKey = `mock_property_${id}`;
            
            return CacheManager.getOrFetch(
                cacheKey,
                async () => {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    const hotel = MOCK_HOTELS.find(h => h.id === id);
                    if (!hotel) {
                        throw new Error('Hotel not found');
                    }
                    
                    // Transform mock data to match expected format
                    return {
                        id: hotel.id,
                        name: hotel.name,
                        address: hotel.address,
                        city: hotel.city,
                        state: hotel.state,
                        latitude: hotel.latitude,
                        longitude: hotel.longitude,
                        images: hotel.images,
                        description: hotel.description,
                        amenities: hotel.amenities,
                        rating: hotel.rating,
                        phone: '+91-1234567890',
                        email: 'info@zenbourg.com',
                        checkInTime: '14:00',
                        checkOutTime: '11:00'
                    };
                },
                600000
            );
        }
        
        return cachedApiCall(
            `/properties/${id}`,
            {},
            `property_${id}`,
            30000 // 30 seconds cache to ensure latest admin edits show quickly
        );
    },
};

export const hotelAPI = propertyAPI;

// ========================================
// RATINGS & FEEDBACK
// ========================================
export const ratingsAPI = {
    submit: async (token: string, data: { serviceRequestId?: string; rating: number; comment?: string; type?: string }) => {
        return apiCall('/ratings', {
            method: 'POST',
            token,
            body: data,
        });
    },
};

// ========================================
// ROOMS APIs
// ========================================

export const roomsAPI = {
    getAll: async (filters?: { category?: string; status?: string; available?: boolean; search?: string; propertyId?: string }) => {
        // Use mock data
        if (USE_MOCK_DATA && filters?.propertyId) {
            const cacheKey = `mock_rooms_${filters.propertyId}`;
            
            return CacheManager.getOrFetch(
                cacheKey,
                async () => {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    // Generate mock rooms for the property
                    const hotel = MOCK_HOTELS.find(h => h.id === filters.propertyId);
                    if (!hotel) return [];
                    
                    const roomTypes = [
                        { type: 'Deluxe Room', category: 'DELUXE', basePrice: hotel.pricePerNight * 0.8 },
                        { type: 'Premium Suite', category: 'SUITE', basePrice: hotel.pricePerNight * 1.2 },
                        { type: 'Executive Room', category: 'EXECUTIVE', basePrice: hotel.pricePerNight },
                    ];
                    
                    return roomTypes.map((room, index) => ({
                        id: `${filters.propertyId}-room-${index + 1}`,
                        propertyId: filters.propertyId,
                        roomNumber: `${100 + index + 1}`,
                        type: room.type,
                        category: room.category,
                        basePrice: Math.round(room.basePrice),
                        maxGuests: room.category === 'SUITE' ? 4 : 2,
                        status: 'AVAILABLE',
                        images: hotel.images,
                        amenities: hotel.amenities,
                        description: `Comfortable ${room.type.toLowerCase()} with modern amenities`
                    }));
                },
                600000
            );
        }
        
        const params = new URLSearchParams();
        if (filters?.category) params.append('category', filters.category);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.available) params.append('available', 'true');
        if (filters?.search) params.append('search', filters.search);
        if (filters?.propertyId) params.append('propertyId', filters.propertyId);

        const query = params.toString();
        const cacheKey = `rooms_${filters?.propertyId || 'all'}_${query}`;
        return cachedApiCall(`/rooms${query ? `?${query}` : ''}`, {}, cacheKey, 30000);
    },

    getAvailable: async () => {
        return cachedApiCall('/rooms?available=true', {}, 'rooms_available', 300000);
    },

    getByCategory: async (category: string) => {
        return cachedApiCall(`/rooms?category=${category}`, {}, `rooms_cat_${category}`, 300000);
    },

    getById: async (id: string) => {
        return cachedApiCall(`/rooms/${id}`, {}, `room_${id}`, 30000);
    },
};

// ========================================
// BOOKINGS APIs
// ========================================

export const bookingsAPI = {
    getMyBookings: async (token: string, status?: string, page: number = 1, limit: number = 10, sortBy?: string, order?: string) => {
        let query = `?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`;
        if (sortBy) query += `&sortBy=${sortBy}`;
        if (order) query += `&order=${order}`;
        
        // Cache bookings for 10 seconds to keep it fresh but fast
        return cachedApiCall(`/bookings${query}`, { token }, `bookings_${status || 'all'}_${page}_${sortBy || 'date'}_${order || 'desc'}`, 10000);
    },

    create: async (
        token: string,
        bookingData: {
            roomId: string;
            checkIn: string;
            checkOut: string;
            numberOfGuests: number;
            specialRequests?: string;
            totalAmount?: number;
        }
    ) => {
        await invalidateData('bookings', token);
        return apiCall('/bookings', {
            method: 'POST',
            token,
            body: bookingData,
        });
    },

    getUpcoming: async (token: string) => {
        return apiCall('/bookings?status=RESERVED', { token });
    },

    getActive: async (token: string) => {
        return apiCall('/bookings?status=CHECKED_IN', { token });
    },

    getPast: async (token: string) => {
        return cachedApiCall('/bookings?status=CHECKED_OUT', { token }, 'bookings_CHECKED_OUT', 300000);
    },

    updateStatus: async (token: string, bookingId: string, status: string) => {
        const res = await apiCall('/bookings', {
            method: 'PATCH',
            token,
            body: { bookingId, status },
        });
        await invalidateData('bookings', token);
        return res;
    },

    payBalance: async (token: string, bookingId: string, amount: number) => {
        const res = await apiCall('/bookings/pay-balance', {
            method: 'POST',
            token,
            body: { bookingId, amount },
        });
        await invalidateData('bookings', token);
        return res;
    },

    // Called from checkin screen — updates booking to CHECKED_IN in admin panel
    checkIn: async (token: string, bookingId: string, data?: {
        idType?: string;
        idNumber?: string;
        idImage?: string;
        numberOfGuests?: number;
        specialRequests?: string;
    }) => {
        const res = await apiCall('/guest/check-in', {
            method: 'POST',
            token,
            body: { bookingId, ...data },
        });
        await invalidateData('bookings', token);
        return res;
    },

    // Called from checkout screen — updates booking to CHECKED_OUT in admin panel
    checkOut: async (token: string, bookingId: string) => {
        const res = await apiCall('/guest/check-in', {
            method: 'PATCH',
            token,
            body: { bookingId },
        });
        await invalidateData('bookings', token);
        return res;
    },

    getInvoice: async (token: string, bookingId: string) => {
        return apiCall(`/bookings/${bookingId}/invoice`, { token });
    },

    getReferralEarnings: async (token: string) => {
        return apiCall('/referral/earnings', { token });
    },

    // Alias for getMyBookings to ensure compatibility
    getAll: async (token: string, status?: string, page?: number, limit?: number) => {
        return bookingsAPI.getMyBookings(token, status, page, limit);
    },

    extendStay: async (token: string, bookingId: string, newCheckOut: string) => {
        const res = await apiCall('/bookings/manage', {
            method: 'POST',
            token,
            body: { bookingId, newCheckOut, type: 'EXTEND' },
        });
        await invalidateData('bookings', token);
        return res;
    },

    upgradeStay: async (token: string, bookingId: string, newRoomId: string) => {
        const res = await apiCall('/bookings/manage', {
            method: 'POST',
            token,
            body: { bookingId, newRoomId, type: 'UPGRADE' },
        });
        await invalidateData('bookings', token);
        return res;
    },
};

// ========================================
// MENU / FOOD APIs
// ========================================

export const menuAPI = {
    getAll: async (filters?: { category?: string; isVeg?: boolean; search?: string; propertyId?: string }) => {
        const params = new URLSearchParams();
        if (filters?.category) params.append('category', filters.category);
        if (filters?.isVeg !== undefined) params.append('isVeg', filters.isVeg.toString());
        if (filters?.search) params.append('search', filters.search);
        if (filters?.propertyId) params.append('propertyId', filters.propertyId);

        const query = params.toString();
        const cacheKey = `menu_${filters?.propertyId || 'all'}_${query}`;
        return cachedApiCall(`/menu${query ? `?${query}` : ''}`, {}, cacheKey, 300000);
    },

    getByCategory: async (category: string) => {
        return cachedApiCall(`/menu?category=${category}`, {}, `menu_cat_${category}`, 300000);
    },

    getVegOnly: async () => {
        return cachedApiCall('/menu?isVeg=true', {}, 'menu_veg', 300000);
    },
};

// ========================================
// SERVICE REQUESTS APIs
// ========================================

export const servicesAPI = {
    getMyRequests: async (token: string) => {
        const cacheKey = `my_services_${token.substring(0, 10)}`;
        return cachedApiCall('/services', { token }, cacheKey, 60000); // 1 min for requests
    },

    getById: async (token: string, serviceId: string) => {
        return apiCall(`/services/${serviceId}`, { token });
    },

    // Send a message to the assigned staff member for a service request
    sendMessage: async (token: string, serviceId: string, content: string) => {
        return apiCall(`/services/${serviceId}`, {
            method: 'POST',
            token,
            body: { content },
        });
    },

    create: async (
        token: string,
        serviceData: {
            type: 'HOUSEKEEPING' | 'FOOD_ORDER' | 'ROOM_SERVICE' | 'LAUNDRY' | 'MAINTENANCE' | 'CONCIERGE' | 'SPA' | 'WAKEUP' | 'TOILETRIES';
            title: string;
            description?: string;
            roomId?: string;
            priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
            amount?: number;
            scheduledAt?: string;
        }
    ) => {
        await CacheManager.clearByPrefix('my_services');
        return apiCall('/services', {
            method: 'POST',
            token,
            body: serviceData,
        });
    },

    getConfigs: async (propertyId: string) => {
        return apiCall(`/services/configs?propertyId=${propertyId}`);
    },

    // Specific service request helpers
    requestHousekeeping: async (token: string, roomId: string, description: string) => {
        return servicesAPI.create(token, {
            type: 'HOUSEKEEPING',
            title: 'Housekeeping Request',
            description,
            roomId,
        });
    },

    orderFood: async (token: string, roomId: string, items: any[], totalAmount: number) => {
        return servicesAPI.create(token, {
            type: 'FOOD_ORDER',
            title: 'Food Order',
            description: `Order: ${items.map(i => i.name).join(', ')}`,
            roomId,
            amount: totalAmount,
        });
    },

    requestWakeup: async (token: string, roomId: string, time: string) => {
        return servicesAPI.create(token, {
            type: 'ROOM_SERVICE',
            title: 'Wake-up Call',
            description: `Wake-up call requested for ${time}`,
            roomId,
        });
    },

    requestLinens: async (token: string, roomId: string, items: string[]) => {
        return servicesAPI.create(token, {
            type: 'HOUSEKEEPING',
            title: 'Linen Request',
            description: `Requested items: ${items.join(', ')}`,
            roomId,
        });
    },

    requestToiletries: async (token: string, roomId: string, items: string[]) => {
        return servicesAPI.create(token, {
            type: 'TOILETRIES',
            title: 'Toiletries Request',
            description: `Requested items: ${items.join(', ')}`,
            roomId,
        });
    },

    requestWakeupCall: async (token: string, roomId: string, time: string) => {
        return servicesAPI.create(token, {
            type: 'WAKEUP',
            title: 'Wake-up Call',
            description: `Guest requested a wake-up call at ${time}`,
            roomId,
            scheduledAt: time,
        });
    },

    getMyRequests: async (token: string, propertyId?: string) => {
        let url = '/services';
        if (propertyId) url += `?propertyId=${propertyId}`;
        return apiCall(url, { token });
    },
};

// ========================================
// GUEST PROFILE APIs
// ========================================

export const profileAPI = {
    get: async (token: string) => {
        const cacheKey = `profile_${token.substring(0, 10)}`;
        return cachedApiCall('/guest/profile', { token }, cacheKey, 300000);
    },

    update: async (
        token: string,
        profileData: {
            name?: string;
            email?: string;
            address?: string;
            profileImage?: string;
            idType?: string;
            idNumber?: string;
            idDocumentFront?: string;
            idDocumentBack?: string;
        }
    ) => {
        await invalidateData('profile', token);
        return apiCall('/guest/profile', {
            method: 'PUT',
            token,
            body: profileData,
        });
    },
};

// ========================================
// FAVORITES APIs
// ========================================

export const favoritesAPI = {
    getAll: async (token: string) => {
        const cacheKey = `favorites_${token.substring(0, 10)}`;
        return cachedApiCall('/favorites', { token }, cacheKey, 120000); // 2 mins
    },

    add: async (token: string, roomId: string) => {
        const cacheKey = `favorites_${token.substring(0, 10)}`;
        return cachedApiCall('/favorites', {
            method: 'POST',
            token,
            body: { roomId },
        }, cacheKey);
    },

    remove: async (token: string, roomId: string) => {
        const cacheKey = `favorites_${token.substring(0, 10)}`;
        return cachedApiCall(`/favorites?roomId=${roomId}`, {
            method: 'DELETE',
            token,
        }, cacheKey);
    },
};

// ========================================
// AMENITIES APIs
// ========================================

export const amenitiesAPI = {
    getAll: async (propertyId?: string) => {
        const query = propertyId ? `?propertyId=${propertyId}` : '';
        return apiCall(`/amenities${query}`);
    },
    getDashboardServices: async (propertyId: string) => {
        return apiCall(`/dashboard-services?propertyId=${propertyId}`, { silent: true });
    }
};

// ========================================
// HELP / SUPPORT APIs
// ========================================

export const helpAPI = {
    createTicket: async (token: string, ticketData: {
        type: 'TECHNICAL' | 'BOOKING' | 'PAYMENT' | 'OTHER' | 'LOST_ITEM';
        subject: string;
        message: string;
        propertyId?: string; // If related to a specific hotel
        priority?: 'LOW' | 'NORMAL' | 'HIGH';
    }) => {
        return apiCall('/support/tickets', {
            method: 'POST',
            token,
            body: ticketData,
        });
    },

    getMyTickets: async (token: string) => {
        return apiCall('/support/tickets', { token });
    },

    addMessage: async (token: string, ticketId: string, content: string) => {
        return apiCall(`/support/tickets/${ticketId}/messages`, {
            method: 'POST',
            token,
            body: { content }
        });
    }
};

// ========================================
// PAYMENTS / RAZORPAY APIs
// ========================================

export const paymentsAPI = {
    createOrder: async (token: string, amount: number, notes?: any) => {
        return apiCall('/payments/order', {
            method: 'POST',
            token,
            body: { amount, notes },
        });
    },

    verifyPayment: async (token: string, paymentData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        return apiCall('/payments/verify', {
            method: 'POST',
            token,
            body: paymentData,
        });
    },

    createMandate: async (token: string, amount: number) => {
        return apiCall('/payments/mandate', {
            method: 'POST',
            token,
            body: { amount },
        });
    },
};

// ========================================
// WALLET APIs
// ========================================

export const walletAPI = {
    getBalance: async (token: string) => {
        return apiCall('/wallet/balance', { token });
    },

    getTransactions: async (token: string, type?: 'CREDIT' | 'DEBIT') => {
        const query = type ? `?type=${type}` : '';
        return apiCall(`/wallet/transactions${query}`, { token });
    },

    addMoney: async (token: string, amount: number) => {
        await CacheManager.clearByPrefix('wallet');
        return apiCall('/wallet/add', {
            method: 'POST',
            token,
            body: { amount },
        });
    },

    deductMoney: async (token: string, amount: number, reason: string) => {
        await CacheManager.clearByPrefix('wallet');
        return apiCall('/wallet/deduct', {
            method: 'POST',
            token,
            body: { amount, reason },
        });
    },
};

// ========================================
// REFERRAL APIs
// ========================================

export const referralAPI = {
    getMyReferralCode: async (token: string) => {
        return apiCall('/referral/code', { token });
    },

    getReferralStats: async (token: string) => {
        return apiCall('/referral/stats', { token });
    },

    getReferrals: async (token: string) => {
        return apiCall('/referral/list', { token });
    },

    applyReferralCode: async (token: string, code: string) => {
        await CacheManager.clearByPrefix('referral');
        return apiCall('/referral/apply', {
            method: 'POST',
            token,
            body: { code },
        });
    },

    getReferralEarnings: async (token: string) => {
        return apiCall('/referral/earnings', { token });
    },
};

export const notificationsAPI = {
    getNotifications: async (token: string, onlyUnread: boolean = false) => {
        return apiCall(`/notifications?unread=${onlyUnread}`, { token });
    },
    getUnread: async (token: string) => {
        return apiCall('/notifications?unread=true', { token });
    },
    markAsRead: async (token: string, notificationId?: string, markAll: boolean = false) => {
        const res = await apiCall('/notifications', {
            method: 'PATCH',
            token,
            body: { notificationId, markAll }
        });
        await invalidateData('notifications', token);
        return res;
    }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

export const API_CONFIG = {
    BASE_URL,
};

// Export all APIs as a single object
export const API = {
    auth: authAPI,
    property: propertyAPI,
    hotel: hotelAPI,
    rooms: roomsAPI,
    bookings: bookingsAPI,
    menu: menuAPI,
    services: servicesAPI,
    profile: profileAPI,
    favorites: favoritesAPI,
    amenities: amenitiesAPI,
    payments: paymentsAPI,
    help: helpAPI,
    wallet: walletAPI,
    referral: referralAPI,
    notifications: notificationsAPI,
};

export default API;
