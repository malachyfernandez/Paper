import React, { useEffect, useState } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import PoppinsText from '../text/PoppinsText';

interface LoadingTextProps {
    text: string;
    delayMs?: number;
    fadeDuration?: number;
}

const LoadingText = ({
    text,
    delayMs = 700,
    fadeDuration = 300,
}: LoadingTextProps) => {
    const [dots, setDots] = useState(1);
    const opacity = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    useEffect(() => {
        const fadeInTimer = setTimeout(() => {
            opacity.value = withTiming(1, { duration: fadeDuration });
        }, delayMs);

        return () => clearTimeout(fadeInTimer);
    }, [delayMs, fadeDuration, opacity]);

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((current) => (current % 3) + 1);
        }, 500);

        return () => clearInterval(interval);
    }, []);

    const dotsText = '.'.repeat(dots);

    return (
        <Animated.View style={animatedStyle}>
            <PoppinsText weight='medium' varient='subtext' className='bg-text/5 px-4 py-3 rounded-2xl'>
                {text}{dotsText}
            </PoppinsText>
        </Animated.View>
    );
};

export default LoadingText;
