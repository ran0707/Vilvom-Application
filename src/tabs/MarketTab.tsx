import React, { useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';

// Use correct, category-specific, royalty-free images
type Product = {
  id: string;
  title: string;
  price: string;
  image: string;
  tag?: string;
  category?: string;
  dealerName?: string;
  dealerPhone?: string;
  coords?: { lat: number; lon: number } | null;
};

const PRODUCTS: Product[] = [
  // Tea Products
  {
    id: '1',
    title: 'Orthodox Black Tea - 1kg',
    price: '₹450',
    image: 'https://m.media-amazon.com/images/I/716sWHOmyNL._UF1000,1000_QL80_.jpg', // black tea leaves
    tag: 'Black Tea',
    category: 'Black Tea',
    dealerName: 'Tea World Store',
    dealerPhone: '+919900112233',
    coords: { lat: 10.123, lon: 76.456 },
  },
  {
    id: '2',
    title: 'Green Tea Loose - 500g',
    price: '₹350',
    image: 'https://m.media-amazon.com/images/I/71XBwfDUXYL._UF894,1000_QL80_.jpg', // green tea leaves
    tag: 'Green Tea',
    category: 'Green Tea',
    dealerName: 'Fresh Tea Co.',
    dealerPhone: '+919900112234',
    coords: { lat: 11.01, lon: 75.34 },
  },
  {
    id: '3',
    title: 'Organic Tea Saplings (10 nos)',
    price: '₹999',
    image: 'https://rukminim2.flixcart.com/image/480/480/xif0q/tea/f/p/u/750-no-10-ctc-leaf-tea-750-gm-assam-leaf-premium-black-tea-500-original-imah2d4wjf4mzbyd.jpeg?q=90', // tea plant saplings
    tag: 'Saplings',
    category: 'Saplings',
    dealerName: 'Garden Supply Center',
    dealerPhone: '+919900112235',
    coords: { lat: 10.45, lon: 76.78 },
  },
  // Pesticides & Chemicals (distinct bottles/labels)
  {
    id: '4',
    title: 'Neem Oil Organic Pesticide - 1L',
    price: '₹299',
    image: 'https://m.media-amazon.com/images/I/91vlZo010OL.jpg', // neem oil bottle
    tag: 'Organic',
    category: 'Pesticides',
    dealerName: 'Green Agro Solutions',
    dealerPhone: '+919900112236',
    coords: { lat: 10.15, lon: 76.25 },
  },
  {
    id: '5',
    title: 'Chlorpyrifos 20% EC - 500ml',
    price: '₹450',
    image: 'https://5.imimg.com/data5/SELLER/Default/2024/3/395063233/WP/DQ/GA/101400887/clorid-chlorpyrifos-20-ec-bottle-500-ml-1-ltr.jpg', // chemical bottle
    tag: 'Insecticide',
    category: 'Pesticides',
    dealerName: 'AgroTech Supplies',
    dealerPhone: '+919900112237',
    coords: { lat: 10.95, lon: 76.55 },
  },
  {
    id: '6',
    title: 'Mancozeb Fungicide - 1kg',
    price: '₹520',
    image: 'https://5.imimg.com/data5/SELLER/Default/2021/7/QW/GH/SA/6616513/mancozeb-75-wp-contact-fungicide.jpg', // fungicide container
    tag: 'Fungicide',
    category: 'Pesticides',
    dealerName: 'Crop Care Center',
    dealerPhone: '+919900112238',
    coords: { lat: 10.35, lon: 76.42 },
  },
  {
    id: '7',
    title: '2,4-D Herbicide - 1L',
    price: '₹380',
    image: 'https://5.imimg.com/data5/SELLER/Default/2023/6/315549492/PG/VW/CE/88101488/2-4-d-main-adama-herbicides.jpeg', // herbicide bottle
    tag: 'Herbicide',
    category: 'Pesticides',
    dealerName: 'Farm Solutions Ltd',
    dealerPhone: '+919900112239',
    coords: { lat: 10.65, lon: 76.18 },
  },
  // Fertilizers
  {
    id: '8',
    title: 'NPK 19:19:19 - 50kg',
    price: '₹1,200',
    image: 'https://5.imimg.com/data5/SELLER/Default/2023/9/341754838/CL/XW/OR/99548530/npk-500x500.jpg', // fertilizer pellets bag
    tag: 'Complex',
    category: 'Fertilizers',
    dealerName: 'Fertilizer Hub',
    dealerPhone: '+919900112240',
    coords: { lat: 10.78, lon: 76.33 },
  },
  {
    id: '9',
    title: 'Urea - 50kg',
    price: '₹850',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_Qx8m8vHUv5t-AuF1DCaboOx19peUmE8mcg&s', // fertilizer pellets bag
    tag: 'Nitrogen',
    category: 'Fertilizers',
    dealerName: 'Krishi Kendra',
    dealerPhone: '+919900112241',
    coords: { lat: 10.22, lon: 76.67 },
  },
  
];

function distanceInKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  // Haversine formula
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

// Optional native modules (geolocation) - safe require
let Geolocation = null;
try { Geolocation = require('@react-native-community/geolocation'); } catch (e) {}

const MarketTab = () => {
  const [query, setQuery] = useState<string>('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [category, setCategory] = useState<string>('All');
  const [nearbyOnly, setNearbyOnly] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const categories = [
    'All', 'Pesticides', 'Fertilizers', 'Equipment', 'Black Tea', 'Green Tea', 'Saplings'
  ];

  const filtered = PRODUCTS.filter(p => {
    const matchesQuery =
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.tag?.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === 'All' ? true : p.category === category;
    let matchesNearby = true;
    if (nearbyOnly && userLocation && p.coords) {
      const d = distanceInKm(userLocation, p.coords);
      matchesNearby = d <= 50;
    }
    return matchesQuery && matchesCategory && matchesNearby;
  }).sort((a, b) => {
    if (userLocation && a.coords && b.coords) {
      const distanceA = distanceInKm(userLocation, a.coords);
      const distanceB = distanceInKm(userLocation, b.coords);
      return distanceA - distanceB;
    }
    return a.title.localeCompare(b.title);
  });

  const inputRef = useRef<any>(null);
  const { t } = useTranslation();

  const requestLocation = async () => {
    const useGlobal =
      !Geolocation &&
      typeof (globalThis as any).navigator !== 'undefined' &&
      (globalThis as any).navigator.geolocation;
    if (!Geolocation && !useGlobal) {
      Alert.alert(
        'Location not available',
        'Location module not available. Check permissions or try again.',
        [{ text: 'OK' }]
      );
      return;
    }
    try {
      setLocating(true);
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location permission',
            message: 'We need your location to show nearby products',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission denied', 'Cannot access location');
          setLocating(false);
          return;
        }
      }
      const success = (pos: any) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setLocating(false);
      };
      const failure = (err: any) => {
        setLocating(false);
        Alert.alert('Location Error', err?.message || 'Failed to get location', [{ text: 'OK' }]);
      };
      if (Geolocation) {
        Geolocation.getCurrentPosition(success, failure, {
          enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
      } else if (useGlobal) {
        (globalThis as any).navigator.geolocation.getCurrentPosition(
          success, failure,
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      }
    } catch {
      setLocating(false);
      Alert.alert('Error', 'Failed to request location', [{ text: 'OK' }]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tea Market</Text>
        <Text style={styles.subtitle}>Find teas, equipment, and chemicals near you</Text>
      </View>
      <View style={styles.headerActions}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12 }}>
          {categories.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.catPill, category === c && styles.catPillActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.catText, category === c && styles.catTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search product, type or tag"
          value={query}
          onChangeText={setQuery}
          style={[styles.search, { flex: 1 }]}
        />
        <TouchableOpacity
          onPress={() => {
            setNearbyOnly(!nearbyOnly);
            if (!nearbyOnly && !userLocation) {
              requestLocation();
            }
          }}
          style={[styles.nearbyToggle, nearbyOnly && styles.nearbyToggleActive]}
        >
          <Text style={[
            styles.nearbyToggleText,
            nearbyOnly && styles.nearbyToggleTextActive,
          ]}>
            {nearbyOnly ? '📍 Nearby' : '🌍 All'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={requestLocation} style={styles.locButton}>
          {locating
            ? <ActivityIndicator color="#4CAF50" />
            : <Text style={{ color: '#4CAF50', fontWeight: '700' }}>
                {userLocation ? '📍' : 'Use location'}
              </Text>
          }
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setSelected(item as Product)}
            activeOpacity={0.86}
          >
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardInfo}>
              <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',marginTop:4}}>
                <Text style={styles.price}>{item.price}</Text>
                <Text style={styles.cardTag}>{item.tag}</Text>
              </View>
            </View>
            <Text style={styles.dealer}>{item.dealerName}</Text>
          </TouchableOpacity>
        )}
      />
      <Modal visible={!!selected} animationType="slide" transparent={false} onRequestClose={() => setSelected(null)}>
        {selected && (
          <ScrollView style={styles.detailContainer}>
            <TouchableOpacity onPress={() => setSelected(null)} style={{ marginBottom: 12 }}>
              <Text style={{ color: '#4CAF50', fontWeight: '700', fontSize:16 }}>← Back</Text>
            </TouchableOpacity>
            <Image
              source={{ uri: (selected as Product).image }}
              style={styles.detailImage}
            />
            <Text style={styles.detailTitle}>{(selected as Product).title}</Text>
            <Text style={styles.detailPrice}>{(selected as Product).price}</Text>
            <Text style={styles.detailTag}>{(selected as Product).tag}</Text>
            <Text style={styles.dealerDetail}>Dealer: {(selected as Product).dealerName}</Text>
            <Text style={styles.desc}>
              The best quality {(selected as Product).category?.toLowerCase()} available. Contact the dealer for details or visit location.
            </Text>
            {/* Dealer actions */}
            <View style={{ marginTop: 24 }}>
              {(selected as Product).dealerPhone && (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${(selected as Product).dealerPhone}`)} style={styles.actionBtn}>
                  <Text style={styles.actionText}>Call Dealer</Text>
                </TouchableOpacity>
              )}
              {(selected as Product).coords && (
                <TouchableOpacity
                  onPress={() => {
                    const { lat, lon } = (selected as Product).coords as { lat: number; lon: number };
                    const url = Platform.select({
                      ios: `maps:0,0?q=${(selected as Product).title}@${lat},${lon}`,
                      android: `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent((selected as Product).title)})`,
                    }) as string | undefined;
                    if (url) Linking.openURL(url);
                  }}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionText}>Open in Maps</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fa' },
  header: { padding: 16, paddingBottom:4 },
  title: { fontSize: 24, fontWeight: '800', color: '#233a54' },
  subtitle: { color: '#666', marginTop: 4, fontSize: 15 },
  headerActions: { paddingVertical: 8 },
  searchRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  search: {
    backgroundColor: '#f7fafc',
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4e8ee',
    fontSize: 15.2,
    color: '#233a54'
  },
  catPill: {
    backgroundColor: '#e8f0fc',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
    marginBottom: 5
  },
  catPillActive: {
    backgroundColor: '#4CAF50',
  },
  catText: {
    color: '#43656c',
    fontWeight: '600',
  },
  catTextActive: {
    color: '#fff',
  },
  locButton: {
    marginLeft: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  nearbyToggle: {
    marginLeft: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: '#f7fafc',
  },
  nearbyToggleActive: {
    backgroundColor: '#4CAF50',
  },
  nearbyToggleText: {
    color: '#4CAF50',
    fontWeight: '700',
    fontSize: 13.2,
  },
  nearbyToggleTextActive: {
    color: '#fff',
  },
  columnWrapper: { justifyContent: 'space-between', marginBottom:18 },
  card: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    flex: 0.48,
    overflow: 'hidden',
    minHeight: 222,
    paddingBottom: 7,
    paddingHorizontal:4,
  },
  cardImage: {
    width: '100%',
    height: 102,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#eaf0fd',
  },
  cardInfo: {
    paddingVertical:7,
    paddingHorizontal:7
  },
  cardTitle: {
    fontSize: 15.7,
    color: '#204863',
    fontWeight: '700',
    marginTop: 3,
    marginBottom: 2,
  },
  cardTag: {
    backgroundColor: '#e8f5e9',
    color: '#357c2c',
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 1,
    fontSize: 11.7,
    marginLeft: 8,
    fontWeight: "700"
  },
  price: {
    color: '#4CAF50',
    fontWeight: '800',
    fontSize: 15.5,
  },
  dealer: {
    fontSize: 12.5,
    color: '#7f9299',
    fontWeight: '600',
    paddingLeft: 7,
    paddingBottom:2
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 18,
  },
  detailImage: {
    width: '100%',
    height: 240,
    borderRadius: 18,
    backgroundColor: '#eaf0fd',
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 9,
    color:'#204863'
  },
  detailPrice: {
    color: '#4CAF50',
    fontWeight: '800',
    fontSize: 20,
    marginBottom: 7,
  },
  detailTag: {
    color: '#357c2c',
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    fontSize:14,
    fontWeight:"700",
    paddingHorizontal:9,
    alignSelf: 'flex-start',
    marginBottom:6,
  },
  dealerDetail:{
    fontSize:15,
    color:'#496c7b',
    fontWeight:"600",
    marginBottom:8,
  },
  desc:{
    color:'#444',
    fontSize:15,
    marginTop:8,
    lineHeight:20
  },
  actionBtn:{
    backgroundColor:"#f3f8f5",
    borderRadius:12,
    padding:13,
    marginBottom:12,
    marginHorizontal:5,
  },
  actionText:{
    color:"#4285F4",
    fontSize:16,
    fontWeight:"700"
  }
});

export default MarketTab;
