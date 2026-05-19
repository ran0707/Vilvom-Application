import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  StatusBar,
  Animated,
  LayoutChangeEvent,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import Video from 'react-native-video';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

interface Props {
  onGetStarted: () => void;
}

const { width, height } = Dimensions.get('window');

const GetStartedScreen: React.FC<Props> = ({ onGetStarted }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [maxSlide, setMaxSlide] = useState(220);

  // Shining overlay
  const shineOpacity = useRef(new Animated.Value(0)).current;

  // Gesture handler
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true },
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      if (event.nativeEvent.translationX > maxSlide * 0.7) {
        Animated.spring(translateX, {
          toValue: maxSlide,
          useNativeDriver: true,
        }).start(() => triggerShine());
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  // Animate text fade
  const textOpacity = translateX.interpolate({
    inputRange: [0, maxSlide * 0.6],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const textTranslateX = translateX.interpolate({
    inputRange: [0, maxSlide * 0.6],
    outputRange: [0, 40],
    extrapolate: 'clamp',
  });

  // Button width
  const onButtonLayout = (e: LayoutChangeEvent) => {
    const buttonWidth = e.nativeEvent.layout.width;
    setMaxSlide(buttonWidth - 60);
  };

  // Wiggle animation for idle arrow
  const hintAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loopAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(hintAnim, {
          toValue: 12,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(hintAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loopAnim.start();
    return () => loopAnim.stop();
  }, []);

  const combinedTranslateX = Animated.add(
    translateX.interpolate({
      inputRange: [0, maxSlide],
      outputRange: [0, maxSlide],
      extrapolate: 'clamp',
    }),
    hintAnim,
  );

  // ✨ Shining effect before navigation
  // ✨ Optimized triggerShine
  const triggerShine = () => {
    // Immediately navigate, then play a short shine animation asynchronously
    try {
      onGetStarted(); // navigate right away
    } catch (e) {
      // ignore navigation errors here; still play shine
    }

    shineOpacity.setValue(0);
    Animated.timing(shineOpacity, {
      toValue: 1,
      duration: 150, // very quick flash
      useNativeDriver: true,
    }).start(() => {
      // Fade out overlay after the flash
      Animated.timing(shineOpacity, {
        toValue: 0,
        duration: 300,
        delay: 80,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Video Background */}
      <View style={StyleSheet.absoluteFill}>
        <Video
          source={{
            uri: 'https://www.pexels.com/download/video/28247962/',
          }}
          style={styles.background}
          resizeMode="cover"
          repeat
          muted
          paused={false}
          ignoreSilentSwitch="obey"
          rate={1.0}
        />
        <View style={styles.overlay} />
      </View>

      {/* Logo top left */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/vilvom_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Content overlays */}
      <View style={styles.contentContainer}>
        <View style={styles.textSection}>
          <Text style={styles.title}>
            <Text style={styles.highlight}>Guardians {'\n'}</Text>
            of the Leaf
          </Text>

          <Text style={styles.subtitle}>
            World-first AI platform for tea farmers — trained on 1 lakh+ leaf
            images to detect 15+ pests and diseases, give instant advice, and
            connect with trusted merchants for better harvests.
          </Text>

          {/* Swipe-to-Start Button */}
          <View style={{ alignItems: 'center', marginTop: 28 }}>
            <View style={styles.swipeButton} onLayout={onButtonLayout}>
              <PanGestureHandler
                onGestureEvent={onGestureEvent}
                onHandlerStateChange={onHandlerStateChange}
              >
                <Animated.View
                  style={[
                    styles.swipeIconContainer,
                    { transform: [{ translateX: combinedTranslateX }] },
                  ]}
                >
                  <Text style={styles.swipeIcon}>➔</Text>
                </Animated.View>
              </PanGestureHandler>

              <Animated.Text
                style={[
                  styles.swipeText,
                  {
                    opacity: textOpacity,
                    transform: [{ translateX: textTranslateX }],
                  },
                ]}
              >
                Get Started
              </Animated.Text>
            </View>
          </View>

          {/* Stats */}
        </View>
      </View>

      {/* ✨ Shining overlay */}
      <Animated.View
        pointerEvents="none"
        style={[styles.shineOverlay, { opacity: shineOpacity }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  background: { flex: 1, justifyContent: 'flex-end' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  contentContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  textSection: {
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 44,
  },
  highlight: { color: '#7CB342' },
  subtitle: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 15,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 18,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  primaryBtnText: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  secondaryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    marginTop: 18,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginTop: 12,
  },
  statNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 6,
  },
  bottomSection: {
    paddingHorizontal: 30,
    paddingBottom: 60,
    alignItems: 'center',
  },
  swipeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    width: 250,
    height: 60,
    paddingHorizontal: 10,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  swipeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 6,
    zIndex: 2,
    elevation: 3,
  },
  swipeIcon: {
    color: '#4CAF50',
    fontSize: 30,
    fontWeight: '900',
  },
  swipeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  guestButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },
  guestText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  logoContainer: {
    position: 'absolute',
    top: 5,
    left: 0,
    zIndex:1,
  },
  logo: {
    width: 200,
    height: 100,
  },
  shineOverlay: {
    position: 'absolute',
    width,
    height,
    backgroundColor: '#ffffff',
  },
});

export default GetStartedScreen;
