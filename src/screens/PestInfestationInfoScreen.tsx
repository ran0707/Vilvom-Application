import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const PestInfestationInfoScreen: React.FC = () => {
  const navigation: any = useNavigation();
  const { t } = useTranslation();

  const goAdvisory = () => navigation.navigate('AdvisoryContact');
  const goNews = () => navigation.navigate('LatestTeaNews', { limit: 4 });
  const goBack = () => navigation.goBack();

  // Placeholder recent diagnosis list (replace with real data source later)
  const recentDiagnoses = [
    {
      id: '1',
      pest: 'Looper',
      severity: 'moderate',
      date: 'Today 10:12',
      icon: 'bug',
      image: require('../../assets/tea.png'),
    },
    {
      id: '2',
      pest: 'Thrips',
      severity: 'mild',
      date: 'Yesterday 17:45',
      icon: 'ladybug',
      image: require('../../assets/tea.png'),
    },
    {
      id: '3',
      pest: 'Red Spider Mite',
      severity: 'severe',
      date: 'Aug 28, 14:05',
      icon: 'spider',
      image: require('../../assets/tea.png'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerWrap}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#0b3f2a" />
          </TouchableOpacity>
          <Text style={styles.heading}>{t('pest_infestation.heading')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t('pest_infestation.help_title')}
          </Text>

          <View style={styles.stepsRow}>
            <View style={styles.stepItem}>
              <View style={styles.stepIconWrap}>
                <Icon name="leaf" size={26} color="#0b6b3a" />
              </View>
              <Text style={styles.stepText}>
                {t('pest_infestation.step_take')}
              </Text>
            </View>

            <Icon name="chevron-right" size={20} color="#0b6b3a" />

            <View style={styles.stepItem}>
              <View style={styles.stepIconWrap}>
                <Icon name="magnify" size={26} color="#0b6b3a" />
              </View>
              <Text style={styles.stepText}>
                {t('pest_infestation.step_analyse')}
              </Text>
            </View>

            <Icon name="chevron-right" size={20} color="#0b6b3a" />

            <View style={styles.stepItem}>
              <View style={styles.stepIconWrap}>
                <Icon
                  name="file-document-edit-outline"
                  size={26}
                  color="#0b6b3a"
                />
              </View>
              <Text style={styles.stepText}>
                {t('pest_infestation.step_recommend')}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.takeBtn} activeOpacity={0.85} onPress={() => navigation.navigate('CameraScreen')}>
            <Text style={styles.takeBtnText}>
              {t('pest_infestation.take_button')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pest Infestation Info Card */}
        <View style={styles.infoCardWrap}>
          <View style={styles.infoCardLeft}>
            <Text style={styles.infoHeading}>
              {t('pest_infestation.info_heading')}
            </Text>
            <Text style={styles.infoSub}>{t('pest_infestation.info_sub')}</Text>
            <TouchableOpacity style={styles.callBtn} activeOpacity={0.85} onPress={goAdvisory}>
              <Text style={styles.callBtnText}>
                {t('pest_infestation.get_help')}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoCardRight}>
            <Image
              source={require('../../assets/tea.png')}
              style={styles.infoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Small two-card row */}
        <View style={styles.smallCardsRow}>
          <TouchableOpacity
            style={styles.smallCard}
            onPress={goAdvisory}
            activeOpacity={0.8}
          >
            <View style={styles.smallCardLeft}>
              <Icon name="account-tie" size={28} color="#0b6b3a" />
            </View>
            <View style={styles.smallCardRight}>
              <Text style={styles.smallCardTitle}>
                {t('pest_infestation.advisory_title')}
              </Text>
              <Text style={styles.smallCardSub}>
                {t('pest_infestation.advisory_sub')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallCard}
            onPress={goNews}
            activeOpacity={0.8}
          >
            <View style={styles.smallCardLeft}>
              <Icon name="newspaper-variant" size={28} color="#0b6b3a" />
            </View>
            <View style={styles.smallCardRight}>
              <Text style={styles.smallCardTitle}>
                {t('pest_infestation.news_title')}
              </Text>
              <Text style={styles.smallCardSub}>
                {t('pest_infestation.news_sub')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

  

        {/* Recent Diagnosis Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>
            {t('pest_infestation.recent_heading')}
          </Text>
        </View>

        <View style={styles.recentHWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentHContent}
          >
            {recentDiagnoses.map(item => (
              <View key={item.id} style={styles.recentCard}>
                <Image source={item.image as any} style={styles.recentImg} />
                <View style={styles.recentCardTextRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentTitle}>{item.pest}</Text>
                    <Text style={styles.recentSub}>{item.date}</Text>
                  </View>
                  <View
                    style={[
                      styles.severityBadge,
                      item.severity === 'severe'
                        ? styles.sevSevere
                        : item.severity === 'moderate'
                        ? styles.sevModerate
                        : styles.sevMild,
                    ]}
                  >
                    <Text style={styles.severityText}>
                      {item.severity === 'severe'
                        ? (t('pest_infestation.severity.severe') as string)
                        : item.severity === 'moderate'
                        ? (t('pest_infestation.severity.moderate') as string)
                        : (t('pest_infestation.severity.mild') as string)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6fbf8' },
  container: { padding: 20 },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#eaf6ef',
    marginRight: 10,
  },
  heading: { fontSize: 22, fontWeight: '800', color: '#0b1f12' },

  card: {
    backgroundColor: '#e9fbf1',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b6b3a',
    marginBottom: 14,
  },

  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 18,
  },
  stepItem: { alignItems: 'center', width: 86 },
  stepIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(11,107,58,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepText: {
    textAlign: 'center',
    color: '#0b3f2a',
    fontSize: 13,
    lineHeight: 18,
  },

  takeBtn: {
    marginTop: 4,
    backgroundColor: '#1b8b47',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  takeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  infoCardWrap: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoCardLeft: { flex: 1, paddingRight: 12 },
  infoHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b3f2a',
    marginBottom: 6,
  },
  infoSub: { fontSize: 14, color: '#444', lineHeight: 20 },
  callBtn: {
    marginTop: 12,
    backgroundColor: '#0b6b3a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  callBtnText: { color: '#fff', fontWeight: '700' },
  infoCardRight: { width: 120, alignItems: 'center' },
  infoImage: { width: 120, height: 120, borderRadius: 8 },

  smallCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  smallCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    elevation: 1,
  },
  smallCardLeft: { width: 48, alignItems: 'center', justifyContent: 'center' },
  smallCardRight: { flex: 1, paddingLeft: 8 },
  smallCardTitle: { fontSize: 14, fontWeight: '700', color: '#0b3f2a' },
  smallCardSub: { fontSize: 12, color: '#666' },

  auctionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    alignItems: 'center',
    elevation: 1,
  },
  auctionLeft: { width: 64, alignItems: 'center', justifyContent: 'center' },
  auctionRight: { flex: 1, paddingLeft: 8 },
  auctionTitle: { fontSize: 16, fontWeight: '800', color: '#0b3f2a' },
  auctionSub: { marginTop: 6, color: '#556b5b' },

  // Recent Diagnosis section
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  sectionBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#0b6b3a',
    marginRight: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0b3f2a' },
  recentList: { marginTop: 4 },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    elevation: 1,
  },
  // Horizontal card list for recent diagnosis
  recentHWrap: { marginTop: 4 },
  recentHContent: { paddingRight: 4 },
  recentCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    elevation: 1,
    overflow: 'hidden',
  },
  recentImg: { width: '100%', height: 110 },
  recentCardTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  recentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(11,107,58,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  recentTextWrap: { flex: 1 },
  recentTitle: { fontSize: 14, fontWeight: '700', color: '#0b3f2a' },
  recentSub: { fontSize: 12, color: '#666', marginTop: 2 },
  severityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  severityText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  sevMild: { backgroundColor: '#4caf50' },
  sevModerate: { backgroundColor: '#ff9800' },
  sevSevere: { backgroundColor: '#f44336' },
});

export default PestInfestationInfoScreen;
