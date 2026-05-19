import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width } = Dimensions.get('window');

import { useNavigation } from '@react-navigation/native';

const DroneBannerCard = () => {
  const navigation = useNavigation<any>();
  const handleContactPress = () => {
    navigation.navigate('Drone');
  };

  return (
    <View style={styles.bannerContainer}>
      {/* Product Badge */}
      <View style={styles.productBadge}>
        <Text style={styles.productText}>Drone Service</Text>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentWrapper}>
        {/* Left Content */}
        <View style={styles.leftContent}>
          <Text
            style={styles.mainTitle}
            numberOfLines={1}
            ellipsizeMode={'tail'}
          >
            Tea plant Drone Solutions
          </Text>
          <Text
            style={styles.description}
            numberOfLines={1}
            ellipsizeMode={'tail'}
          >
            Precision spraying and aerial mapping for tea farms.
          </Text>

          {/* Quick Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Icon name="tint" size={12} color="#fff" />
              <Text
                style={styles.featureText}
                numberOfLines={1}
                ellipsizeMode={'tail'}
              >
                Pesticide Spraying
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="map-marked-alt" size={12} color="#fff" />
              <Text
                style={styles.featureText}
                numberOfLines={1}
                ellipsizeMode={'tail'}
              >
                Aerial Mapping
              </Text>
            </View>
          </View>

          {/* Contact Button */}
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactPress}
          >
            <Text style={styles.contactText}>for more info </Text>
          </TouchableOpacity>
        </View>

        {/* Right Image */}
        <View style={styles.rightImageContainer}>
          <Image
            // source={{
            //   uri: 'https://static.vecteezy.com/system/resources/previews/057/930/612/non_2x/front-view-camera-drone-free-png.png',
            // }}
            source={require('../../assets/bg-drone.png')}
            style={styles.droneImage}
            resizeMode="contain"
          />

          {/* Floating Dots */}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#4285F4',
    borderRadius: 20,
    marginHorizontal: 0,
    marginVertical: 16,
    padding: 16,
    height: 200,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
    position: 'relative',
  },

  productBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },

  productText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  contentWrapper: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },

  leftContent: {
    flex: 1.4,
    paddingRight: 8,
  },

  mainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 18,
    marginBottom: 6,
  },

  description: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 13,
    marginBottom: 10,
    fontWeight: '400',
  },

  featuresContainer: {
    marginBottom: 12,
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  featureText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    marginLeft: 6,
    fontWeight: '500',
  },

  contactButton: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  contactText: {
    color: '#4285F4',
    fontSize: 12,
    fontWeight: '700',
  },

  rightImageContainer: {
    width: 80,
    height: 90,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginRight: 10,
  },

  droneImage: {
    width: 120,
    height: 105,
    zIndex: 2,
  },
});

export default DroneBannerCard;
