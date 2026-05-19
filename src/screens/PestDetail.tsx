import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import PestApi from '../services/pestApi';
import LogoHeader from '../components/LogoHeader';
import { Platform } from 'react-native';
import { API_BASE_URL, DEFAULT_HOST } from '../config/api';

const { width, height } = Dimensions.get('window');

const PestDetail: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState({
    symptoms: true,
    biological: false,
    chemical: false,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const imageScaleAnim = useRef(new Animated.Value(1)).current;
  const confidenceAnim = useRef(new Animated.Value(0)).current;

  const params: any = (route as any).params || {};
  const id = params.id;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await PestApi.getRecommendation(id);
        if (mounted) {
          setItem(data.recommendation || data);
          // Start animations
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]).start();

          // Animate confidence progress
          setTimeout(() => {
            Animated.timing(confidenceAnim, {
              toValue: Number(
                data.recommendation?.confidence || data.confidence || 0,
              ),
              duration: 1000,
              useNativeDriver: false,
            }).start();
          }, 800);
        }
      } catch (e) {
        console.warn('Failed to load recommendation', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return '#FF4444';
      case 'medium':
        return '#FFAA00';
      case 'low':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    const conf = confidence || 0;
    if (conf >= 0.8) return '#4CAF50';
    if (conf >= 0.6) return '#FFAA00';
    return '#FF4444';
  };

  const getPestIcon = (pestType?: string) => {
    // Return appropriate icon based on pest type
    return 'bug-report';
  };

  const handleShare = async () => {
    if (!item) return;
    try {
      const message = `Pest Detected: ${
        item.pestName || 'Unknown'
      }\nConfidence: ${(Number(item.confidence) * 100 || 0).toFixed(
        0,
      )}%\nSeverity: ${item.severity || 'Unknown'}`;
      await Share.share({ message });
    } catch (error) {
      Alert.alert('Error', 'Failed to share pest information');
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon
        name="bug-report"
        size={64}
        color="#ADB5BD"
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No Pest Data Found</Text>
      <Text style={styles.emptySubtitle}>
        Unable to load pest information. Please try again.
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => {
          setLoading(true);
          // Retry logic here
          setTimeout(() => setLoading(false), 1000);
        }}
      >
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo Header */}
      <LogoHeader
        logoSize={{ width: 80, height: 80 }}
        marginTop={10}
        position="top-left"
      />

      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('nav.pest_detail') || 'Pest Detail'}
          </Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Icon name="share" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading pest details...</Text>
          </View>
        ) : !item ? (
          renderEmpty()
        ) : (
          <View style={styles.content}>
            {/* Image Section */}
            <View style={styles.imageSection}>
              {item.imagePath ? (
                <Animated.Image
                  source={{
                    uri: `${DEFAULT_HOST}${item.imagePath}`,
                  }}
                  style={[
                    styles.heroImage,
                    { transform: [{ scale: imageScaleAnim }] },
                  ]}
                  resizeMode="cover"
                />
              ) : item.meta?.processed_image ? (
                <Animated.Image
                  source={{
                    uri: `data:image/jpeg;base64,${item.meta.processed_image}`,
                  }}
                  style={[
                    styles.heroImage,
                    { transform: [{ scale: imageScaleAnim }] },
                  ]}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.noImageContainer}>
                  <Icon name="image" size={48} color="#ADB5BD" />
                  <Text style={styles.noImageText}>No image available</Text>
                </View>
              )}

              {/* Severity Badge */}
              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: getSeverityColor(item.severity) },
                ]}
              >
                <Icon name="warning" size={16} color="#FFF" />
                <Text style={styles.severityText}>
                  {item.severity || 'Unknown'} Risk
                </Text>
              </View>
            </View>

            {/* Info Card */}
            <Animated.View
              style={[
                styles.infoCard,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.pestHeader}>
                <View style={styles.pestIconContainer}>
                  <Icon
                    name={getPestIcon(item.pestName)}
                    size={32}
                    color="#4CAF50"
                  />
                </View>
                <View style={styles.pestInfo}>
                  <Text style={styles.pestName}>
                    {item.pestName || 'Unknown Pest'}
                  </Text>
                  <Text style={styles.pestType}>
                    {item.pestType || 'Pest Detection'}
                  </Text>
                </View>
              </View>

              {/* Confidence Section */}
              <View style={styles.confidenceSection}>
                <View style={styles.confidenceHeader}>
                  <Text style={styles.confidenceLabel}>
                    Detection Confidence
                  </Text>
                  <Text style={styles.confidenceValue}>
                    {(Number(item.confidence) * 100 || 0).toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: confidenceAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            '0%',
                            `${(Number(item.confidence) * 100 || 0).toFixed(
                              0,
                            )}%`,
                          ],
                        }),
                        backgroundColor: getConfidenceColor(item.confidence),
                      },
                    ]}
                  />
                </View>
              </View>
            </Animated.View>

            {/* Expandable Sections */}
            <View style={styles.sectionsContainer}>
              {/* Symptoms Section */}
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('symptoms')}
              >
                <View style={styles.sectionTitleContainer}>
                  <Icon name="healing" size={20} color="#4CAF50" />
                  <Text style={styles.sectionTitle}>Symptoms</Text>
                </View>
                <Icon
                  name={
                    expandedSections.symptoms ? 'expand-less' : 'expand-more'
                  }
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
              {expandedSections.symptoms && (
                <View style={styles.sectionContent}>
                  {item.symptoms && item.symptoms.length > 0 ? (
                    item.symptoms.map((symptom: string, index: number) => (
                      <View key={index} style={styles.symptomItem}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.symptomText}>{symptom}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>
                      No symptoms data available
                    </Text>
                  )}
                </View>
              )}

              {/* Biological Control Section */}
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('biological')}
              >
                <View style={styles.sectionTitleContainer}>
                  <Icon name="eco" size={20} color="#4CAF50" />
                  <Text style={styles.sectionTitle}>Biological Control</Text>
                </View>
                <Icon
                  name={
                    expandedSections.biological ? 'expand-less' : 'expand-more'
                  }
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
              {expandedSections.biological && (
                <View style={styles.sectionContent}>
                  {item.biologicalControl &&
                  item.biologicalControl.length > 0 ? (
                    item.biologicalControl.map(
                      (control: string, index: number) => (
                        <View key={index} style={styles.controlItem}>
                          <View style={styles.bulletPoint} />
                          <Text style={styles.controlText}>{control}</Text>
                        </View>
                      ),
                    )
                  ) : (
                    <Text style={styles.noDataText}>
                      No biological control data available
                    </Text>
                  )}
                </View>
              )}

              {/* Chemical Control Section */}
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('chemical')}
              >
                <View style={styles.sectionTitleContainer}>
                  <Icon name="science" size={20} color="#4CAF50" />
                  <Text style={styles.sectionTitle}>Chemical Control</Text>
                </View>
                <Icon
                  name={
                    expandedSections.chemical ? 'expand-less' : 'expand-more'
                  }
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
              {expandedSections.chemical && (
                <View style={styles.sectionContent}>
                  {item.chemicalControl && item.chemicalControl.length > 0 ? (
                    item.chemicalControl.map(
                      (control: string, index: number) => (
                        <View key={index} style={styles.controlItem}>
                          <View style={styles.bulletPoint} />
                          <Text style={styles.controlText}>{control}</Text>
                        </View>
                      ),
                    )
                  ) : (
                    <Text style={styles.noDataText}>
                      No chemical control data available
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
              >
                <Icon name="call" size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>Call Expert</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
              >
                <Icon name="info" size={20} color="#4CAF50" />
                <Text style={styles.secondaryButtonText}>More Info</Text>
              </TouchableOpacity>
            </View>

            {/* Timestamp */}
            {item.createdAt && (
              <View style={styles.timestampContainer}>
                <Icon name="schedule" size={16} color="#ADB5BD" />
                <Text style={styles.timestamp}>
                  Detected on{' '}
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF3EA' },
  headerGradient: {
    backgroundColor: '#4CAF50',
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  imageSection: {
    marginBottom: 16,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  noImageContainer: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
  },
  noImageText: {
    fontSize: 16,
    color: '#ADB5BD',
  },
  severityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  severityText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  pestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pestIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pestInfo: {
    flex: 1,
  },
  pestName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  pestType: {
    fontSize: 14,
    color: '#6C757D',
  },
  confidenceSection: {
    marginBottom: 16,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionsContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginLeft: 8,
  },
  sectionContent: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginTop: 6,
    marginRight: 12,
  },
  symptomText: {
    flex: 1,
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  controlText: {
    flex: 1,
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#6C757D',
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#ADB5BD',
    marginLeft: 6,
  },
});

export default PestDetail;
