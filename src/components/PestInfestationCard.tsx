import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width } = Dimensions.get('window');

type Props = {
  onScan: () => void;
  onLearnMore: () => void;
};

const PestInfestationCard: React.FC<Props> = ({ onScan, onLearnMore }) => {
  return (
    <View style={styles.bannerContainer}>
      {/* Product Badge */}
      <View style={styles.productBadge}>
        <Text style={styles.productText}>AI Service</Text>
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
            Pest Infestation Scan
          </Text>
          <Text
            style={styles.description}
            numberOfLines={2}
            ellipsizeMode={'tail'}
          >
            Scan tea leaves for early pest signs. AI-powered detection gives
            instant insights & solutions.
          </Text>

          {/* Quick Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Icon name="bug" size={12} color="#fff" />
              <Text style={styles.featureText}>Pest Detection</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="leaf" size={12} color="#fff" />
              <Text style={styles.featureText}>AI Recommendations</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.scanButton} onPress={onScan}>
              <Text style={styles.scanText}>Scan Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.learnButton} onPress={onLearnMore}>
              <Text style={styles.learnText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Image */}
        <View style={styles.rightImageContainer}>
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/2900/2900497.png',
            }}
            style={styles.leafImage}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    marginHorizontal: 0,
    marginVertical: 16,
    padding: 16,
    height: 200,
    shadowColor: '#2E7D32',
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

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  scanButton: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  scanText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
  },

  learnButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },

  learnText: {
    color: '#fff',
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

  leafImage: {
    width: 100,
    height: 90,
    zIndex: 2,
  },
});

export default PestInfestationCard;
