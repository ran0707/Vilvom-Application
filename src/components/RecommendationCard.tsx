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
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const RecommendationCard = () => {
  const navigation = useNavigation<any>();

  const handleExplore = () => {
    if ((navigation as any).navigate) (navigation as any).navigate('PPCInfo');
  };

  const handleTryScan = () => {
    if ((navigation as any).navigate)
      (navigation as any).navigate('PestQuestionnaire');
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.leftCompact}>
          <Text style={styles.badgeText}>PPC Recommendations</Text>
          <Text style={styles.titleCompact} numberOfLines={1}>
            Recommendation System
          </Text>
          <Text style={styles.descCompact} numberOfLines={1}>
            PPC-driven product & practice suggestions to improve yield.
          </Text>

          <View style={styles.featuresCompact}>
            <View style={styles.featureSmall}>
              <Icon name="leaf" size={12} color="#fff" />
              <Text style={styles.featureSmallText}>Personalized</Text>
            </View>
            <View
              style={[
                styles.featureSmall,
                { backgroundColor: 'rgba(255,255,255,0.12)' },
              ]}
            >
              <Icon name="chart-line" size={12} color="#fff" />
              <Text style={styles.featureSmallText}>PPC Optimized</Text>
            </View>
          </View>

          <View style={styles.actionsCompact}>
            <TouchableOpacity style={styles.tryBtn} onPress={handleTryScan}>
              <Text style={styles.tryBtnText}>Try PPC</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExplore}>
              <Text style={styles.learnText}>Learn more</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.rightCompact}>
          <View style={styles.logoBg}>
            <Image
              source={require('../../assets/tealogo.png')}
              style={styles.logoCompact}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2BB673', // soft green to match tea logo
    borderRadius: 20,
    marginVertical: 12,
    padding: 14,
    height: 180,
    shadowColor: '#1E8C4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  accentCircle: {
    position: 'absolute',
    right: -40,
    top: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    transform: [{ scale: 1 }],
  },
  innerRow: { flexDirection: 'row', flex: 1, alignItems: 'center' },
  left: { flex: 1.4, paddingRight: 8 },
  right: { width: 110, alignItems: 'center', justifyContent: 'center' },
  headRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  badge: {
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 8,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  title: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  desc: { color: 'rgba(255,255,255,0.95)', fontSize: 12, marginBottom: 10 },
  /* compact variants */
  row: { flexDirection: 'row', alignItems: 'center' },
  leftCompact: { flex: 1, paddingRight: 8 },
  titleCompact: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  descCompact: { color: 'rgba(255,255,255,0.92)', fontSize: 12, marginTop: 6 },
  featuresCompact: { flexDirection: 'row', marginTop: 8 },
  featureSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  featureSmallText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 11,
    fontWeight: '700',
  },
  actionsCompact: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  tryBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
  },
  tryBtnText: { color: '#0B6B2F', fontWeight: '800' },
  learnText: {
    color: 'rgba(255,255,255,0.95)',
    textDecorationLine: 'underline',
  },
  rightCompact: { width: 96, alignItems: 'center', justifyContent: 'center' },
  logoBg: {
    width: 90,
    height: 90,
    borderRadius: 39,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  logoCompact: { width: 86, height: 86, borderRadius: 8 },
  featureRow: { flexDirection: 'row', marginBottom: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
  },
  chipText: { color: '#fff', fontSize: 11, marginLeft: 6, fontWeight: '700' },
  ctaRow: { flexDirection: 'row', marginTop: 6, alignItems: 'center' },
  ctaPrimary: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginRight: 10,
  },
  ctaPrimaryText: { color: '#0B6B2F', fontWeight: '800' },
  ctaGhost: {
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  ctaGhostText: { color: '#fff', fontWeight: '700' },
  image: { width: 100, height: 120, borderRadius: 12 },
});

export default RecommendationCard;
