import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiresIn: number;
}

class CacheManager {
    private static instance: CacheManager;
    private memoryCache: Map<string, any> = new Map();
    
    private constructor() {}
    
    static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }
    
    async set<T>(key: string, data: T, expiresIn: number = 300000): Promise<void> {
        const cacheItem: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            expiresIn
        };
        
        this.memoryCache.set(key, cacheItem);
        
        try {
            await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }
    
    async get<T>(key: string): Promise<T | null> {
        const memoryItem = this.memoryCache.get(key);
        if (memoryItem && !this.isExpired(memoryItem)) {
            return memoryItem.data;
        }
        
        try {
            const cached = await AsyncStorage.getItem(`cache_${key}`);
            if (cached) {
                const cacheItem: CacheItem<T> = JSON.parse(cached);
                
                if (!this.isExpired(cacheItem)) {
                    this.memoryCache.set(key, cacheItem);
                    return cacheItem.data;
                } else {
                    await this.remove(key);
                }
            }
        } catch (error) {
            console.error('Cache get error:', error);
        }
        
        return null;
    }
    
    private isExpired(cacheItem: CacheItem<any>): boolean {
        return Date.now() - cacheItem.timestamp > cacheItem.expiresIn;
    }
    
    async remove(key: string): Promise<void> {
        this.memoryCache.delete(key);
        try {
            await AsyncStorage.removeItem(`cache_${key}`);
        } catch (error) {
            console.error('Cache remove error:', error);
        }
    }
    
    async clear(): Promise<void> {
        this.memoryCache.clear();
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(key => key.startsWith('cache_'));
            await AsyncStorage.multiRemove(cacheKeys);
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }

    async clearByPrefix(prefix: string): Promise<void> {
        // Clear from memory
        for (const key of this.memoryCache.keys()) {
            if (key.startsWith(prefix)) {
                this.memoryCache.delete(key);
            }
        }
        // Clear from AsyncStorage
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(key => key.startsWith(`cache_${prefix}`));
            if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys);
            }
        } catch (error) {
            console.error('Cache clearByPrefix error:', error);
        }
    }
    
    async getOrFetch<T>(
        key: string,
        fetchFn: () => Promise<T>,
        expiresIn: number = 300000
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }
        
        const data = await fetchFn();
        await this.set(key, data, expiresIn);
        return data;
    }
}

export default CacheManager.getInstance();
