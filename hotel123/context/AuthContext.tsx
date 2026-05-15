import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileAPI } from '../services/api';

interface AuthContextType {
    token: string | null;
    user: any | null;
    login: (token: string, user: any) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
    language: string;
    setLanguage: (lang: string) => Promise<void>;
    updateUser: (newUser: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    token: null,
    user: null,
    login: async () => { },
    logout: async () => { },
    loading: true,
    language: 'English',
    setLanguage: async () => { },
    updateUser: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [language, setLanguageState] = useState('English');

    useEffect(() => {
        loadStoredData();
    }, []);

    const loadStoredData = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            const storedUser = await AsyncStorage.getItem('user');
            const storedLang = await AsyncStorage.getItem('language');
            if (storedToken) setToken(storedToken);
            if (storedUser) setUser(JSON.parse(storedUser));
            if (storedLang) setLanguageState(storedLang);
        } catch (error) {
            console.error('Error loading auth data:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (newToken: string, newUser: any) => {
        try {
            await AsyncStorage.setItem('token', newToken);
            await AsyncStorage.setItem('user', JSON.stringify(newUser));
            setToken(newToken);
            setUser(newUser);
        } catch (error) {
            console.error('Error saving auth data:', error);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setToken(null);
            setUser(null);
        } catch (error) {
            console.error('Error removing auth data:', error);
        }
    };

    const updateUser = async (newUser: any) => {
        try {
            const updatedUser = { ...user, ...newUser };
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        } catch (error) {
            console.error('Error updating user data:', error);
        }
    };

    const setLanguage = async (lang: string) => {
        try {
            await AsyncStorage.setItem('language', lang);
            setLanguageState(lang);

            if (token) {
                // Sync with backend
                await profileAPI.update(token, {
                    // @ts-ignore - language is dynamically added to backend schema
                    language: lang
                });
            }
        } catch (error) {
            console.error('Error saving language:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, loading, language, setLanguage, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
