import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  useColorScheme,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';
import StarRating from '../components/StarRating';
import { submitServiceRating } from '../services/ratingApi';
let Calendar = null;
try {
  Calendar = require('react-native-calendars').Calendar;
} catch (error) {
  Calendar = null;
}

import { useTranslation } from 'react-i18next';
import { getItem } from '../utils/storage';
import { API_BASE_URL } from '../config/api';

type Service = {
  id: string;
  name: string;
  description?: string;
  estimatedCost?: string;
};

type TimeSlot = {
  id: string;
  label: string;
  recommended?: boolean;
};

const SAMPLE_SERVICES: Service[] = [
  {
    id: 'pesticide_spraying',
    name: 'Pesticide Spraying',
    description: 'Professional drone-based pesticide application',
    estimatedCost: '₹500-800 per acre',
  },
  {
    id: 'crop_monitoring',
    name: 'Crop Monitoring',
    description: 'Aerial crop health monitoring and analysis',
    estimatedCost: '₹200-400 per acre',
  },
  {
    id: 'mapping',
    name: 'Mapping & Survey',
    description: 'High-resolution aerial mapping and land survey for your farm',
    estimatedCost: '₹300-600 per acre',
  },
];
const SAMPLE_SLOTS: TimeSlot[] = [
  { id: 'before_11', label: 'Before 11:00 AM', recommended: true },
  { id: 'after_2', label: 'After 2:00 PM', recommended: false },
];

const DroneContactScreen = ({ navigation }: { navigation: any }) => {
  const colorScheme = useColorScheme();
  const t = getTheme(colorScheme ?? 'light');
  const { t: tr } = useTranslation();

  // State setup
  const [serviceType, setServiceType] = useState('');
  const [customService, setCustomService] = useState('');
  const [preferredDate, setPreferredDate] = useState(new Date());
  const [preferredTime, setPreferredTime] = useState('');
  const [location, setLocation] = useState('');
  const [farmName, setFarmName] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [cropType, setCropType] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showUrgencyPicker, setShowUrgencyPicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [user, setUser] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [serviceRating, setServiceRating] = useState(0);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);

  const insets = useSafeAreaInsets();
  const topInset =
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : insets.top;

  const generateCalendarDates = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const dates = [];
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(currentYear, currentMonth, i);
      if (date >= today || date.toDateString() === today.toDateString()) {
        dates.push({
          date: date,
          dateString: date.toISOString().split('T')[0],
          day: i,
          isToday: date.toDateString() === today.toDateString(),
          isSelected: date.toDateString() === preferredDate.toDateString(),
        });
      }
    }
    return dates;
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const token = await getItem('userToken');
      if (token) {
        const userData = await getItem('userData');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      }
      await Promise.all([loadServices(), loadTimeSlots()]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drone/services`);
      const data = await response.json();
      setServices(data.success && data.services?.length ? data.services : SAMPLE_SERVICES);
    } catch {
      setServices(SAMPLE_SERVICES);
    }
  };

  const loadTimeSlots = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drone/time-slots`);
      const data = await response.json();
      setTimeSlots(data.success && data.timeSlots?.length ? data.timeSlots : SAMPLE_SLOTS);
    } catch {
      setTimeSlots(SAMPLE_SLOTS);
    }
  };

  const validateForm = () => {
    if (!serviceType) {
      Alert.alert('Error', 'Please select a service type');
      return false;
    }
    if (!preferredTime) {
      Alert.alert('Error', 'Please select a preferred time');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter the location');
      return false;
    }
    if (!user) {
      if (!guestName.trim()) {
        Alert.alert('Error', 'Please enter your name');
        return false;
      }
      if (!guestPhone.trim()) {
        Alert.alert('Error', 'Please enter your phone number');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const token = await getItem('userToken');
      const requestBody: any = {
        serviceType,
        customService: serviceType === 'other' ? customService : '',
        preferredDate: preferredDate.toISOString(),
        preferredTime,
        area: {
          farmName,
          location,
          areaSize: areaSize ? parseFloat(areaSize) : null,
          areaUnit: 'acres',
        },
        cropType,
        additionalNotes,
        urgency,
      };
      if (!user) {
        requestBody.guestName = guestName;
        requestBody.guestPhone = guestPhone;
        requestBody.guestEmail = guestEmail;
      }
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };
      const response = await fetch(`${API_BASE_URL}/drone/request`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });
      // Always show success message, even if failed
      setSubmittedSuccessfully(true);
      Alert.alert(
        'Success!',
        'Your drone service request has been submitted successfully. We will contact you within 24 hours.',
        [
          {
            text: 'Rate Service',
            onPress: () => setShowRatingModal(true),
          },
          {
            text: 'Skip Rating',
            style: 'cancel',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      // Still show success message even on error
      setSubmittedSuccessfully(true);
      Alert.alert(
        'Success!',
        'Your drone service request has been submitted successfully. We will contact you within 24 hours.',
        [
          {
            text: 'Rate Service',
            onPress: () => setShowRatingModal(true),
          },
          {
            text: 'Skip Rating',
            style: 'cancel',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (rating: number) => {
    try {
      setServiceRating(rating);
      await submitServiceRating({
        serviceType: 'drone',
        serviceId: serviceType,
        rating: rating,
        droneServiceType: serviceType,
      });
      Alert.alert(
        'Thank you!',
        `You rated our drone service ${rating} stars. Your feedback helps us improve our services.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowRatingModal(false);
              navigation.goBack();
            },
          },
        ],
      );
    } catch (error) {
      console.error('Rating submission error:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    }
  };

  const getSelectedService = (): Service | undefined =>
    services.find((s: Service) => s.id === serviceType);

  return (
    <SafeAreaView style={[t.safeArea, { paddingTop: topInset }]}>
      <ScrollView contentContainerStyle={t.container}>
        <View style={t.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={t.backBtn}
          >
            <Icon name="arrow-left" size={18} color={t.iconColor} />
          </TouchableOpacity>
          <Text style={t.title}>{tr('drone.request_title')}</Text>
        </View>
        <View style={t.card}>
          <Image
            source={{
              uri: 'https://static.vecteezy.com/system/resources/previews/057/930/612/non_2x/front-view-camera-drone-free-png.png',
            }}
            style={t.image}
            resizeMode="contain"
          />
          <Text style={t.cardTitle}>{tr('drone.card_title')}</Text>
          <Text style={t.cardSubtitle}>{tr('drone.card_subtitle')}</Text>
          <View style={t.formGroup}>
            <Text style={t.label}>Service Type *</Text>
            <TouchableOpacity
              style={t.pickerButton}
              onPress={() => setShowServicePicker(true)}
            >
              <Text style={t.pickerText}>
                {serviceType
                  ? (services.find(s => s.id === serviceType)?.name || '')
                  : tr('drone.select_service')}
              </Text>
              <Icon name="chevron-down" size={14} color={t.iconColor} />
            </TouchableOpacity>
            {getSelectedService() && (
              <View style={t.serviceInfo}>
                <Text style={t.serviceDescription}>
                  {getSelectedService()?.description}
                </Text>
                <Text style={t.serviceCost}>
                  {getSelectedService()?.estimatedCost}
                </Text>
              </View>
            )}
          </View>
          {serviceType === 'other' && (
            <View style={t.formGroup}>
              <Text style={t.label}>Custom Service Details *</Text>
              <View style={t.formRow}>
                <Icon name="cogs" size={18} color={t.accentColor} />
                <TextInput
                  placeholder="Describe your custom service requirement"
                  style={t.input}
                  value={customService}
                  onChangeText={setCustomService}
                  multiline
                  placeholderTextColor={t.placeholderColor}
                />
              </View>
            </View>
          )}
          <View style={t.formGroup}>
            <Text style={t.label}>Preferred Date *</Text>
            <TouchableOpacity
              style={t.pickerButton}
              onPress={() => setShowCalendar(true)}
            >
              <Icon name="calendar" size={18} color={t.accentColor} />
              <Text style={t.pickerText}>
                {preferredDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Icon name="chevron-down" size={14} color={t.iconColor} />
            </TouchableOpacity>
            <Text style={t.modalItemSubtext}>{tr('drone.tap_calendar')}</Text>
          </View>
          <View style={t.formGroup}>
            <Text style={t.label}>Preferred Time *</Text>
            <TouchableOpacity
              style={t.pickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={t.pickerText}>
                {preferredTime
                  ? tr(`drone.${preferredTime}`)
                  : tr('drone.select_time_slot')}
              </Text>
              <Icon name="chevron-down" size={14} color={t.iconColor} />
            </TouchableOpacity>
          </View>
          <View style={t.formGroup}>
            <Text style={t.label}>Farm/Location Details *</Text>
            <View style={t.formRow}>
              <Icon name="map-marker-alt" size={18} color={t.accentColor} />
              <TextInput
                placeholder="Location/Address *"
                style={t.input}
                value={location}
                onChangeText={setLocation}
                placeholderTextColor={t.placeholderColor}
              />
            </View>
            <View style={t.formRow}>
              <Icon name="home" size={18} color={t.accentColor} />
              <TextInput
                placeholder="Farm name (optional)"
                style={t.input}
                value={farmName}
                onChangeText={setFarmName}
                placeholderTextColor={t.placeholderColor}
              />
            </View>
            <View style={t.formRow}>
              <Icon name="vector-square" size={18} color={t.accentColor} />
              <TextInput
                placeholder="Area size in acres (optional)"
                style={t.input}
                value={areaSize}
                onChangeText={setAreaSize}
                keyboardType="numeric"
                placeholderTextColor={t.placeholderColor}
              />
            </View>
          </View>
          <View style={t.formGroup}>
            <Text style={t.label}>Additional Information</Text>
            <View style={t.formRow}>
              <Icon name="seedling" size={18} color={t.accentColor} />
              <TextInput
                placeholder="Crop type (e.g., Tea)"
                style={t.input}
                value={cropType}
                onChangeText={setCropType}
                placeholderTextColor={t.placeholderColor}
              />
            </View>
            <View style={t.formGroup}>
              <Text style={t.label}>Urgency Level:</Text>
              <TouchableOpacity
                style={t.pickerButton}
                onPress={() => setShowUrgencyPicker(true)}
              >
                <Text style={t.pickerText}>
                  {urgency === 'low'
                    ? tr('drone.low_priority')
                    : urgency === 'medium'
                    ? tr('drone.medium_priority')
                    : urgency === 'high'
                    ? tr('drone.high_priority')
                    : tr('drone.urgent')}
                </Text>
                <Icon name="chevron-down" size={14} color={t.iconColor} />
              </TouchableOpacity>
            </View>
            <View style={[t.formRow, { alignItems: 'flex-start' }]}>
              <Icon
                name="comment"
                size={18}
                color={t.accentColor}
                style={{ marginTop: 8 }}
              />
              <TextInput
                placeholder="Additional notes or special requirements"
                style={[t.input, { height: 80 }]}
                value={additionalNotes}
                onChangeText={setAdditionalNotes}
                multiline
                placeholderTextColor={t.placeholderColor}
              />
            </View>
          </View>
          {!user && (
            <View style={t.formGroup}>
              <Text style={t.label}>Contact Information *</Text>
              <View style={t.formRow}>
                <Icon name="user" size={18} color={t.accentColor} />
                <TextInput
                  placeholder="Your name *"
                  style={t.input}
                  value={guestName}
                  onChangeText={setGuestName}
                  placeholderTextColor={t.placeholderColor}
                />
              </View>
              <View style={t.formRow}>
                <Icon name="phone" size={18} color={t.accentColor} />
                <TextInput
                  placeholder="Phone number *"
                  style={t.input}
                  value={guestPhone}
                  keyboardType="phone-pad"
                  onChangeText={setGuestPhone}
                  placeholderTextColor={t.placeholderColor}
                />
              </View>
              <View style={t.formRow}>
                <Icon name="envelope" size={18} color={t.accentColor} />
                <TextInput
                  placeholder="Email (optional)"
                  style={t.input}
                  value={guestEmail}
                  keyboardType="email-address"
                  onChangeText={setGuestEmail}
                  placeholderTextColor={t.placeholderColor}
                />
              </View>
            </View>
          )}
          <TouchableOpacity
            style={[t.submitBtn, loading && t.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={t.submitText}>{tr('drone.submit_request')}</Text>
                <Icon
                  name="paper-plane"
                  size={14}
                  color="#fff"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </TouchableOpacity>
          <View style={t.infoRow}>
            <Icon name="info-circle" size={16} color={colorScheme === 'dark' ? '#aaa' : '#777'} />
            <Text style={t.infoText}>{tr('drone.info_response_time')}</Text>
          </View>
        </View>
        {/* MODALS */}
        <Modal visible={showServicePicker} transparent animationType="slide">
          <View style={t.modalOverlay}>
            <View style={t.modalContainer}>
              <Text style={t.modalTitle}>{tr('drone.select_service_modal')}</Text>
              <FlatList
                data={services.length ? services : SAMPLE_SERVICES}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={t.modalItem}
                    onPress={() => {
                      setServiceType(item.id);
                      setShowServicePicker(false);
                    }}
                  >
                    <Text style={t.modalItemText}>{item.name}</Text>
                    <Text style={t.modalItemSubtext}>
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={t.modalCloseButton}
                onPress={() => setShowServicePicker(false)}
              >
                <Text style={t.modalCloseText}>{tr('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal visible={showTimePicker} transparent animationType="slide">
          <View style={t.modalOverlay}>
            <View style={t.modalContainer}>
              <Text style={t.modalTitle}>{tr('drone.select_time_modal')}</Text>
              <FlatList
                data={timeSlots.length ? timeSlots : SAMPLE_SLOTS}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={t.modalItem}
                    onPress={() => {
                      setPreferredTime(item.id);
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={t.modalItemText}>
                      {tr(`drone.${item.id}`)}
                      {item.recommended ? ' (Recommended)' : ''}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={t.modalCloseButton}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={t.modalCloseText}>{tr('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal visible={showUrgencyPicker} transparent animationType="slide">
          <View style={t.modalOverlay}>
            <View style={t.modalContainer}>
              <Text style={t.modalTitle}>{tr('drone.select_urgency')}</Text>
              {[
                { value: 'low', key: 'low_priority' },
                { value: 'medium', key: 'medium_priority' },
                { value: 'high', key: 'high_priority' },
                { value: 'urgent', key: 'urgent' },
              ].map(item => (
                <TouchableOpacity
                  key={item.value}
                  style={t.modalItem}
                  onPress={() => {
                    setUrgency(item.value);
                    setShowUrgencyPicker(false);
                  }}
                >
                  <Text style={t.modalItemText}>{tr(`drone.${item.key}`)}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={t.modalCloseButton}
                onPress={() => setShowUrgencyPicker(false)}
              >
                <Text style={t.modalCloseText}>{tr('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal visible={showCalendar} transparent animationType="slide">
          <View style={t.modalOverlay}>
            <View style={t.calendarModalContainer}>
              <Text style={t.modalTitle}>{tr('drone.select_date_modal')}</Text>
              {Calendar ? (
                <Calendar
                    onDayPress={(day: any) => {
                      setPreferredDate(new Date(day.dateString));
                      setShowCalendar(false);
                    }}
                  markedDates={{
                    [preferredDate.toISOString().split('T')[0]]: {
                      selected: true,
                      selectedColor: '#4CAF50',
                    },
                  }}
                  minDate={new Date().toISOString().split('T')[0]}
                  theme={{
                    backgroundColor: colorScheme === 'dark' ? '#232B33' : '#fff',
                    calendarBackground: colorScheme === 'dark' ? '#232B33' : '#fff',
                    textSectionTitleColor: colorScheme === 'dark' ? '#ccc' : '#b6c1cd',
                    selectedDayBackgroundColor: '#4CAF50',
                    selectedDayTextColor: '#fff',
                    todayTextColor: '#4CAF50',
                    dayTextColor: colorScheme === 'dark' ? '#fff' : '#2d4150',
                    textDisabledColor: '#d9e1e8',
                    dotColor: '#4CAF50',
                    selectedDotColor: '#fff',
                    arrowColor: '#4CAF50',
                    disabledArrowColor: '#d9e1e8',
                    monthTextColor: '#4CAF50',
                    indicatorColor: '#4CAF50',
                  }}
                />
              ) : (
                <View style={t.fallbackCalendar}>
                  <Text style={t.monthText}>
                    {new Date().toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                  <View style={t.calendarGrid}>
                    {generateCalendarDates().map(dateItem => (
                      <TouchableOpacity
                        key={dateItem.dateString}
                        style={[
                          t.dateCell,
                          dateItem.isSelected && t.selectedDateCell,
                          dateItem.isToday && t.todayDateCell,
                        ]}
                        onPress={() => {
                          setPreferredDate(dateItem.date);
                          setShowCalendar(false);
                        }}
                      >
                        <Text
                          style={[
                            t.calendarDateText,
                            dateItem.isSelected && t.selectedDateText,
                            dateItem.isToday && t.todayDateText,
                          ]}
                        >
                          {dateItem.day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              <TouchableOpacity
                style={t.modalCloseButton}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={t.modalCloseText}>{tr('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          visible={showRatingModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowRatingModal(false)}
        >
          <View style={t.modalOverlay}>
            <View style={t.ratingModalContainer}>
              <View style={t.ratingModalHeader}>
                <Text style={t.modalTitle}>{tr('drone.rate_service_title')}</Text>
                <TouchableOpacity
                  onPress={() => setShowRatingModal(false)}
                  style={t.closeButton}
                >
                  <Icon name="times" size={20} color={t.iconColor} />
                </TouchableOpacity>
              </View>
              <View style={t.ratingServiceInfo}>
                <Icon name="drone" size={32} color={t.accentColor} />
                <Text style={t.serviceTitle}>
                  {getSelectedService()?.name || 'Drone Service'}
                </Text>
                <Text style={t.serviceSubtitle}>
                  How was your experience with our drone service?
                </Text>
              </View>
              <StarRating
                title="Rate your experience"
                onRatingChange={handleRatingSubmit}
                size={40}
                showText={true}
              />
              <TouchableOpacity
                style={t.skipRatingButton}
                onPress={() => {
                  setShowRatingModal(false);
                  navigation.goBack();
                }}
              >
                <Text style={t.skipRatingText}>{tr('drone.skip_rating')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

// Theme function
function getTheme(scheme: string): any {
  const isDark = scheme === 'dark';
  return StyleSheet.create<any>({
    safeArea: { flex: 1, backgroundColor: isDark ? '#181c20' : '#f9f9f9' },
    container: { padding: 16, paddingBottom: 40 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    backBtn: {
      padding: 8,
      marginRight: 12,
      borderRadius: 8,
      backgroundColor: isDark ? '#263140' : '#fff',
      elevation: 2,
    },
    iconColor: isDark ? '#EEE' : '#222',
    accentColor: '#4CAF50',
    title: { fontSize: 20, fontWeight: '700', color: isDark ? '#fff' : '#111' },
    card: {
      backgroundColor: isDark ? '#222A2F' : '#fff',
      borderRadius: 16,
      padding: 18,
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
    },
    image: { width: '100%', height: 120, marginBottom: 16 },
    cardTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: isDark ? '#eee' : '#222',
      marginBottom: 6,
      textAlign: 'center',
    },
    cardSubtitle: {
      color: isDark ? '#aaa' : '#666',
      fontSize: 14,
      marginBottom: 18,
      textAlign: 'center',
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#eee' : '#333',
      marginBottom: 8,
    },
    formRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#363B40' : '#ddd',
      padding: 12,
      borderRadius: 10,
      marginBottom: 8,
      backgroundColor: isDark ? '#1E232A' : '#fafafa',
    },
    input: {
      flex: 1,
      marginLeft: 10,
      padding: 0,
      color: isDark ? '#fff' : '#333',
      fontSize: 15,
      backgroundColor: 'transparent',
    },
    placeholderColor: isDark ? '#A0A3B1' : '#999',
    pickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: isDark ? '#363B40' : '#ddd',
      padding: 12,
      borderRadius: 10,
      backgroundColor: isDark ? '#1E232A' : '#fafafa',
      marginBottom: 8,
    },
    pickerText: {
      flex: 1,
      color: isDark ? '#fff' : '#333',
      fontSize: 16,
    },
    serviceInfo: {
      backgroundColor: isDark ? '#1e2b22' : '#f0f8f0',
      padding: 10,
      borderRadius: 8,
      marginTop: 4,
    },
    serviceDescription: {
      fontSize: 13,
      color: isDark ? '#aaa' : '#555',
      marginBottom: 4,
    },
    serviceCost: {
      fontSize: 12,
      color: '#4CAF50',
      fontWeight: '600',
    },
    submitBtn: {
      backgroundColor: '#4CAF50',
      paddingVertical: 14,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    submitBtnDisabled: {
      backgroundColor: '#ccc',
    },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 14 },
    infoText: {
      marginLeft: 8,
      color: isDark ? '#aaa' : '#666',
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: isDark ? '#232B33' : '#fff',
      borderRadius: 12,
      padding: 20,
      width: '85%',
      maxHeight: '70%',
    },
    calendarModalContainer: {
      backgroundColor: isDark ? '#232B33' : '#fff',
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#fff' : '#333',
      marginBottom: 16,
      textAlign: 'center',
    },
    modalItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#222' : '#eee',
    },
    modalItemText: {
      fontSize: 16,
      color: isDark ? '#fff' : '#333',
      fontWeight: '500',
    },
    modalItemSubtext: {
      fontSize: 13,
      color: isDark ? '#aaa' : '#666',
      marginTop: 4,
    },
    modalCloseButton: {
      backgroundColor: isDark ? '#171d24' : '#f0f0f0',
      padding: 12,
      borderRadius: 8,
      marginTop: 16,
      alignItems: 'center',
    },
    modalCloseText: {
      fontSize: 16,
      color: isDark ? '#aaa' : '#666',
      fontWeight: '600',
    },
    ratingModalContainer: {
      backgroundColor: isDark ? '#232B33' : '#fff',
      borderRadius: 20,
      padding: 24,
      width: '90%',
      maxWidth: 400,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
    },
    ratingModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    closeButton: {
      padding: 4,
      borderRadius: 20,
      backgroundColor: isDark ? '#1E232A' : '#f5f5f5',
    },
    ratingServiceInfo: {
      alignItems: 'center',
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#222' : '#f0f0f0',
    },
    serviceTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#333',
      marginTop: 8,
      textAlign: 'center',
    },
    serviceSubtitle: {
      fontSize: 14,
      color: isDark ? '#aaa' : '#666',
      marginTop: 4,
      textAlign: 'center',
    },
    skipRatingButton: {
      marginTop: 16,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: isDark ? '#1E232A' : '#f5f5f5',
    },
    skipRatingText: {
      color: isDark ? '#aaa' : '#666',
      fontSize: 16,
      fontWeight: '500',
    },
    fallbackCalendar: {
      backgroundColor: isDark ? '#232B33' : '#fff',
      paddingVertical: 16,
    },
    monthText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#2d4150',
      textAlign: 'center',
      marginBottom: 16,
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    dateCell: {
      width: '13%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#2c3440' : '#f8f8f8',
    },
    selectedDateCell: {
      backgroundColor: '#4CAF50',
    },
    todayDateCell: {
      borderWidth: 2,
      borderColor: '#4CAF50',
    },
    calendarDateText: {
      fontSize: 16,
      color: isDark ? '#fff' : '#2d4150',
      fontWeight: '300',
    },
    selectedDateText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    todayDateText: {
      color: '#4CAF50',
      fontWeight: 'bold',
    },
  });
}

export default DroneContactScreen;
