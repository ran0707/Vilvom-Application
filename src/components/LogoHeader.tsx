import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';

interface LogoHeaderProps {
  style?: ViewStyle;
  logoSize?: {
    width?: number;
    height?: number;
  };
  position?: 'top-left' | 'top-center' | 'top-right';
  marginTop?: number;
}

const LogoHeader: React.FC<LogoHeaderProps> = ({
  style,
  logoSize = { width: 350, height: 350 },
  position = 'top-left',
  marginTop = 30,
}) => {
  const getPositionStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      top: marginTop,
      zIndex: 10,
    };

    switch (position) {
      case 'top-center':
        return {
          ...baseStyle,
          alignSelf: 'center' as const,
          left: 0,
          right: 0,
        };
      case 'top-right':
        return { ...baseStyle, right: 20 };
      case 'top-left':
      default:
        return { ...baseStyle, left: 0 };
    }
  };

  return (
    <View style={[getPositionStyle(), style]}>
      <Image
        source={require('../../assets/vilvom_logo.png')}
        style={[styles.logo, logoSize]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  logo: {
    width: 350,
    height: 350,
  },
});

export default LogoHeader;
