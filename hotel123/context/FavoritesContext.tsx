import React, { createContext, useContext, useMemo } from 'react';
import useSWR from 'swr';
import { useAuth } from './AuthContext';
import { favoritesAPI, roomsAPI } from '../services/api';

interface FavoritesContextType {
    favorites: Set<string>; // Set of propertyIds
    favoriteRoomIds: Map<string, string>; // propertyId -> roomId
    favoriteData: any[];
    toggleFavorite: (propertyId: string, hotel?: any) => Promise<void>;
    isLoading: boolean;
    mutate: () => Promise<any>;
}

const FavoritesContext = createContext<FavoritesContextType>({
    favorites: new Set(),
    favoriteRoomIds: new Map(),
    favoriteData: [],
    toggleFavorite: async () => { },
    isLoading: false,
    mutate: async () => { },
});

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
    const { token } = useAuth();

    const { data: favoriteData, mutate, isLoading } = useSWR(
        token ? ['favorites', token] : null,
        () => favoritesAPI.getAll(token!),
        { revalidateOnFocus: true }
    );

    const favorites = useMemo(() => {
        if (!favoriteData || !Array.isArray(favoriteData)) return new Set<string>();
        return new Set<string>(favoriteData.map((f: any) => f.property?.id).filter(Boolean));
    }, [favoriteData]);

    const favoriteRoomIds = useMemo(() => {
        const map = new Map<string, string>();
        if (favoriteData && Array.isArray(favoriteData)) {
            favoriteData.forEach((f: any) => {
                if (f.property?.id && f.roomId) {
                    map.set(f.property.id, f.roomId);
                }
            });
        }
        return map;
    }, [favoriteData]);

    const toggleFavorite = async (propertyId: string, hotel?: any) => {
        if (!token) return;

        const isFav = favorites.has(propertyId);
        const optimisticData = Array.isArray(favoriteData) ? [...favoriteData] : [];

        if (isFav) {
            // Optimistic Remove
            const updatedData = optimisticData.filter((f: any) => f.property?.id !== propertyId);
            mutate(updatedData, false);
        } else if (hotel) {
            // Optimistic Add (only if we have the hotel object)
            const tempFav = {
                id: 'temp-' + Date.now(),
                roomId: 'temp-room',
                property: hotel,
                propertyId: propertyId
            };
            mutate([...optimisticData, tempFav], false);
        }

        try {
            if (isFav) {
                const roomId = favoriteRoomIds.get(propertyId);
                if (roomId) {
                    await favoritesAPI.remove(token, roomId);
                }
            } else {
                const rooms = await roomsAPI.getAll({ propertyId });
                if (rooms && rooms.length > 0) {
                    await favoritesAPI.add(token, rooms[0].id);
                }
            }
            
            // DELAYED REVALIDATION: Wait 2 seconds before re-fetching
            // This ensures the backend DB has definitely finished its transaction
            setTimeout(() => {
                mutate();
            }, 2000);
            
        } catch (error) {
            console.error('Error toggling favorite:', error);
            mutate(); // Revert on error
        }
    };

    return (
        <FavoritesContext.Provider value={{ 
            favorites, 
            favoriteRoomIds, 
            favoriteData: favoriteData || [], 
            toggleFavorite, 
            isLoading,
            mutate 
        }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => useContext(FavoritesContext);
