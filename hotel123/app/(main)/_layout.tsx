
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';

function CustomDrawerContent(props: any) {
    const insets = useSafeAreaInsets();
    const { user, logout, token } = useAuth();
    const t = useTranslation();

    const handleLogout = async () => {
        Alert.alert(t('logout_confirm_title'), t('logout_confirm_msg'), [
            { text: t('cancel'), style: 'cancel' },
            {
                text: t('menu_logout'),
                style: 'destructive',
                onPress: async () => {
                    await logout();
                    router.replace('/(auth)/sign-in');
                }
            }
        ]);
    };

    return (
        <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: insets.top }}>
            <View style={styles.header}>
                <View style={styles.profileIcon}>
                    {user?.profileImage ? (
                        <ExpoImage 
                            source={{ uri: user.profileImage }} 
                            style={styles.avatarImage} 
                            contentFit="cover"
                        />
                    ) : (
                        <Ionicons name="person" size={24} color="rgba(0,0,0,0.3)" />
                    )}
                </View>
                <View>
                    <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
                    <TouchableOpacity onPress={() => router.push('/(main)/user-profile')}>
                        <Text style={styles.viewProfile}>{t('menu_view_profile')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.divider} />

            <DrawerItem
                label={t('menu_home')}
                icon={({ color, size }) => <Ionicons name="home-outline" size={22} color="#2F2E2E" />}
                labelStyle={styles.label}
                onPress={() => {
                    props.navigation.closeDrawer();
                    props.navigation.navigate('home');
                }}
            />
            <DrawerItem
                label={t('menu_bookings')}
                icon={({ color, size }) => <Ionicons name="calendar-outline" size={22} color="#2F2E2E" />}
                labelStyle={styles.label}
                onPress={() => {
                    props.navigation.closeDrawer();
                    props.navigation.navigate('bookings');
                }}
            />
            <DrawerItem
                label={t('menu_favorites')}
                icon={({ color, size }) => <Ionicons name="heart-outline" size={22} color="#2F2E2E" />}
                labelStyle={styles.label}
                onPress={() => {
                    props.navigation.closeDrawer();
                    props.navigation.navigate('favorite');
                }}
            />

            <View style={styles.divider} />

            <DrawerItem label={t('menu_invite')} icon={() => <Ionicons name="share-social-outline" size={22} color="#2F2E2E" />} labelStyle={styles.label} onPress={() => { props.navigation.closeDrawer(); props.navigation.navigate('(drawer)/invite'); }} />
            <DrawerItem label={t('menu_help')} icon={() => <Ionicons name="chatbubbles-outline" size={22} color="#2F2E2E" />} labelStyle={styles.label} onPress={() => { props.navigation.closeDrawer(); props.navigation.navigate('(drawer)/help'); }} />
            <DrawerItem label={t('menu_faqs')} icon={() => <Ionicons name="help-buoy-outline" size={22} color="#2F2E2E" />} labelStyle={styles.label} onPress={() => { props.navigation.closeDrawer(); props.navigation.navigate('(drawer)/faq'); }} />
            <DrawerItem label={t('menu_terms')} icon={() => <Ionicons name="shield-checkmark-outline" size={22} color="#2F2E2E" />} labelStyle={styles.label} onPress={() => { props.navigation.closeDrawer(); props.navigation.navigate('(drawer)/terms'); }} />
            <DrawerItem label={t('menu_wallet')} icon={() => <Ionicons name="wallet-outline" size={22} color="#2F2E2E" />} labelStyle={styles.label} onPress={() => { props.navigation.closeDrawer(); props.navigation.navigate('(drawer)/wallet'); }} />
            <DrawerItem label={t('menu_language')} icon={() => <Ionicons name="globe-outline" size={22} color="#2F2E2E" />} labelStyle={styles.label} onPress={() => { props.navigation.closeDrawer(); props.navigation.navigate('(drawer)/language'); }} />
            <DrawerItem label={t('menu_list_property')} icon={() => <Ionicons name="business-outline" size={22} color="#2F2E2E" />} labelStyle={styles.label} onPress={() => { props.navigation.closeDrawer(); props.navigation.navigate('(drawer)/list-property'); }} />

            <View style={styles.divider} />

            {token ? (
                <DrawerItem 
                    label={t('menu_logout')} 
                    icon={() => <Ionicons name="log-out-outline" size={22} color="red" />} 
                    labelStyle={[styles.label, { color: 'red' }]} 
                    onPress={handleLogout} 
                />
            ) : (
                <DrawerItem 
                    label="Login" 
                    icon={() => <Ionicons name="log-in-outline" size={22} color="#2F2E2E" />} 
                    labelStyle={styles.label} 
                    onPress={() => {
                        props.navigation.closeDrawer();
                        router.replace('/(auth)/sign-in');
                    }} 
                />
            )}
        </DrawerContentScrollView>
    );
}

export default function MainLayout() {
    return (
        <View style={{ flex: 1 }}>
            <Drawer
                drawerContent={(props) => <CustomDrawerContent {...props} />}
                screenOptions={{
                    headerShown: false,
                    drawerStyle: { width: '80%' },
                    swipeEnabled: true,
                    unmountOnBlur: false,
                }}
            >
                {/* Main Tab Screens Only */}
                <Drawer.Screen name="home" />
                <Drawer.Screen name="bookings" />
                <Drawer.Screen name="book" />
                <Drawer.Screen name="favorite" />
                <Drawer.Screen name="user-profile" />
                
                {/* All other screens are Stack screens, not Drawer screens */}
                {/* This allows proper back navigation */}
            </Drawer>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    profileIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    userName: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#2F2E2E'
    },
    viewProfile: {
        fontSize: 14,
        color: 'gray',
        fontFamily: 'Inter-Regular',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 10,
        marginHorizontal: 16
    },
    label: {
        fontFamily: 'Inter-Regular',
        color: '#2F2E2E',
        marginLeft: -10
    }
});
