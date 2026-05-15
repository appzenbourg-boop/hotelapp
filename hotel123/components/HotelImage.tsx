import React, { useState } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

interface HotelImageProps extends Omit<ImageProps, 'source' | 'onLoad' | 'onError'> {
    source: { uri: string } | number;
    placeholder?: string;
    priority?: 'low' | 'normal' | 'high';
    onLoad?: (event: any) => void;
    onError?: (error: any) => void;
}

export function HotelImage({ 
    source, 
    placeholder, 
    priority = 'normal',
    style,
    ...props 
}: HotelImageProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    if (typeof source === 'number') {
        return <Image source={source} style={style} {...props} />;
    }
    
    const { tintColor, ...otherProps } = props;
    
    return (
        <View style={[style, styles.container]}>
            <ExpoImage
                source={source}
                style={[StyleSheet.absoluteFill]}
                contentFit="cover"
                transition={200}
                priority={priority}
                cachePolicy="memory-disk"
                onLoadStart={() => setLoading(true)}
                onLoad={() => setLoading(false)}
                onError={() => {
                    setLoading(false);
                    setError(true);
                }}
                {...otherProps as any}
            />
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#999" />
                </View>
            )}
        </View>
    );
}

export default HotelImage;

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        backgroundColor: '#f0f0f0'
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0'
    }
});
