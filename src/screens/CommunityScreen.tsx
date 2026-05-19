import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';

const AVATAR_COLORS = ['#99d17b', '#5fa8d3', '#f7c59f', '#f67280', '#355c7d'];
type User = { name: string; avatar?: string | null };
type Message = {
  id: string;
  text?: string;
  image?: string | null;
  user: User;
  time: Date | string;
};
type Channel = { id: string; name: string; messages: Message[] };

const getAvatarColor = (name: string) => {
  let seed = 0;
  for (let i = 0; i < name.length; i++) seed += name.charCodeAt(i);
  return AVATAR_COLORS[seed % AVATAR_COLORS.length];
};
const DRAWER_WIDTH = 260;

const Bubble = ({ item, isMine }: { item: Message; isMine: boolean }) => (
  <View style={[
    styles.bubble,
    isMine ? styles.bubbleMine : styles.bubbleOther,
    { alignSelf: isMine ? 'flex-end' : 'flex-start', flexDirection: isMine ? 'row-reverse' : 'row' }
  ]}>
    {item.user.avatar ?
      <Image source={{ uri: item.user.avatar }} style={styles.avatar} /> :
      <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.user.name) }]}>
        <Text style={styles.avatarInitial}>{item.user.name[0] || "U"}</Text>
      </View>
    }
    <View style={styles.bubbleContent}>
      <View style={styles.bubbleHeader}>
        <Text style={styles.bubbleUser}>{item.user.name}</Text>
        <Text style={styles.bubbleTime}>
          {typeof item.time === "string"
            ? new Date(item.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            : item.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {item.text ?
        <Text style={styles.bubbleText}>{item.text}</Text> : null}
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.bubbleImage} />
      ) : null}
    </View>
  </View>
);

const CommunityScreen = () => {
  const { t } = useTranslation();
  const [channels, setChannels] = useState<Channel[]>([
    { id: 'general', name: t('community.general') || "General", messages: [] },
  ]);
  const [currentChannel, setCurrentChannel] = useState<string>('general');
  const [newChannel, setNewChannel] = useState('');
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Slide-in drawer animation
  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };
  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: -DRAWER_WIDTH,
      duration: 250,
      easing: Easing.in(Easing.quad),
      useNativeDriver: false,
    }).start(() => setDrawerOpen(false));
  };

  // Channels
  const addChannel = () => {
    if (
      newChannel.trim() &&
      !channels.find(c => c.name === newChannel.trim())
    ) {
      const id = Date.now().toString();
      setChannels([...channels, { id, name: newChannel.trim(), messages: [] }]);
      setNewChannel('');
    }
  };
  const deleteChannel = (id: string) => {
    setChannels(channels.filter(c => c.id !== id));
    if (currentChannel === id) setCurrentChannel('general');
    closeDrawer();
  };

  // Messaging
  const sendMessage = (imageUri?: string | null) => {
    if (!input.trim() && !imageUri) return;
    const channelIndex = channels.findIndex(c => c.id === currentChannel);
    if (channelIndex < 0) return;
    const channel = channels[channelIndex];
    const msg: Message = {
      id: Date.now().toString(),
      text: input.trim() || undefined,
      image: imageUri || null,
      user: { name: 'You', avatar: null },
      time: new Date(),
    };
    const updated = [...channels];
    updated[channelIndex] = {
      ...channel,
      messages: [...channel.messages, msg],
    };
    setChannels(updated);
    setInput('');
    if (/@camellia|\/camellia/i.test(input)) {
      const aiMsg: Message = {
        id: 'ai' + Date.now(),
        text: 'AI response to camellia mention',
        user: { name: 'Camellia', avatar: null },
        time: new Date(),
      };
      updated[channelIndex].messages.push(aiMsg);
      setChannels([...updated]);
    }
  };

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, res => {
      if (res.assets?.length) sendMessage(res.assets[0].uri);
    });
  };

  const filtered = channels.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const renderDrawer = (
    <Animated.View style={[styles.drawer, { left: drawerAnim }]}>
      <SafeAreaView>
        <View style={styles.drawerTopRow}>
          <Text style={styles.drawerTitle}>{t('community.channels') || 'Channels'}</Text>
          <TouchableOpacity onPress={closeDrawer}>
            <Icon name="times" size={22} color="#357c2c" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.drawerSearch}
          placeholder="Search channels"
          value={search}
          onChangeText={setSearch}
        />
        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.drawerChannelItem,
                item.id === currentChannel && styles.drawerChannelActive
              ]}
              onPress={() => {
                setCurrentChannel(item.id);
                closeDrawer();
              }}
              onLongPress={() => deleteChannel(item.id)}
            >
              <Text style={[
                styles.drawerChannelText,
                item.id === currentChannel && styles.drawerChannelActiveText
              ]}>{item.name}</Text>
            </TouchableOpacity>
          )}
          style={{ marginBottom: 10 }}
        />
        <View style={styles.drawerAddRow}>
          <TextInput
            style={styles.drawerAddInput}
            placeholder="New channel"
            value={newChannel}
            onChangeText={setNewChannel}
          />
          <TouchableOpacity style={styles.drawerAddBtn} onPress={addChannel}>
            <Icon name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );

  const msgs = channels.find(c => c.id === currentChannel)?.messages ?? [];
  const { height: screenHeight } = Dimensions.get('window');
  const inputBarHeight = 56 + (Platform.OS === "ios" ? 18 : 0);

  return (
    <View style={styles.full}>
      {/* Sleek animated drawer */}
      {drawerOpen && (
        <TouchableOpacity
          style={styles.drawerBackdrop}
          activeOpacity={1}
          onPress={closeDrawer}
        />
      )}
      {renderDrawer}
      <SafeAreaView style={styles.bg}>
        {/* Top Bar / Channel */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuBtn} onPress={openDrawer}>
            <Icon name="bars" size={23} color="#357c2c" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {channels.find(c => c.id === currentChannel)?.name || "General"}
          </Text>
        </View>
        {/* CHAT BODY */}
        <View style={[styles.chatArea, { paddingBottom: inputBarHeight + 4 }]}>
          {msgs.length === 0 ? (
            <View style={styles.emptyState}>
              <Image
                source={{ uri: "https://cdn-icons-png.flaticon.com/512/3259/3259742.png" }}
                style={{ width: 100, height: 100, marginBottom: 10, opacity: 0.9 }}
                resizeMode="contain"
              />
              <Text style={styles.emptyStateText}>No messages yet. Start the conversation!</Text>
            </View>
          ) : (
            <FlatList
              data={msgs}
              keyExtractor={m => m.id}
              renderItem={({ item }) => (
                <Bubble item={item} isMine={item.user.name === 'You'} />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 16, paddingBottom: 16 }}
            />
          )}
        </View>
        {/* INPUT BAR */}
        <View style={[styles.inputBar, { height: inputBarHeight }]}>
          <TouchableOpacity onPress={pickImage} style={styles.inputIconBtn}>
            <Icon name="image" size={22} color="#357c2c" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type your message…"
            placeholderTextColor="#599d55"
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            style={styles.sendBtn}
            activeOpacity={input.trim() ? 0.7 : 1}
          >
            <Icon name="paper-plane" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: "#f4f7f3" },
  bg: { flex: 1, backgroundColor: "#f4f7f3" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#defbe6",
    paddingVertical: 14,
    paddingHorizontal: 14,
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#d0ede3",
  },
  menuBtn: { marginRight: 7, padding: 2 },
  headerTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#357c2c"
  },
  chatArea: {
    flex: 1,
    minHeight: 200,
    paddingHorizontal: 8,
    backgroundColor: "#f4f7f3",
  },
  inputBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#defbe6",
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#bce3d7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.11,
    shadowRadius: 24,
    elevation: 4,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 9,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
    color: "#357c2c",
    borderWidth: 1,
    borderColor: "#cce6d3",
    elevation: 1,
  },
  inputIconBtn: { padding: 4 },
  sendBtn: {
    backgroundColor: "#357c2c",
    padding: 12,
    borderRadius: 22,
    marginLeft: 1,
    elevation: 2,
  },
  // Drawer
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#e8f5e9',
    zIndex: 99,
    elevation: 23,
    shadowColor: "#188c46",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    borderRightWidth: 1,
    borderRightColor: "#bce3d7",
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 98,
    backgroundColor: 'rgba(30,60,30,0.14)'
  },
  drawerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 2,
    justifyContent: 'space-between',
  },
  drawerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#357c2c',
    marginBottom: 4,
  },
  drawerSearch: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    fontSize: 15.5,
    color: "#357c2c",
    borderWidth: 1,
    borderColor: "#aee6c9",
    marginHorizontal: 13,
    marginBottom: 6,
    marginTop: 6,
  },
  drawerChannelItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 9,
    marginBottom: 4,
    marginHorizontal: 10,
    backgroundColor: "#e6faee",
  },
  drawerChannelActive: {
    backgroundColor: "#bdf2c9",
  },
  drawerChannelText: {
    fontSize: 16,
    color: "#357c2c",
    fontWeight: "600"
  },
  drawerChannelActiveText: {
    fontWeight: "800", color: '#12712c'
  },
  drawerAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginHorizontal: 13,
  },
  drawerAddInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 13,
    fontSize: 15,
    color: '#357c2c',
    borderColor: "#aee6c9",
    borderWidth: 1,
    marginRight: 8,
  },
  drawerAddBtn: {
    backgroundColor: '#357c2c',
    borderRadius: 16,
    padding: 8,
    elevation: 2,
  },
  // Bubble
  bubble: {
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 18,
    maxWidth: '77%',
    alignItems: 'flex-end',
    minWidth: 128,
    shadowColor: "#aaa",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 6,
  },
  bubbleMine: { backgroundColor: "#d4ebbb", marginRight: 2 },
  bubbleOther: { backgroundColor: "#fff", borderColor: "#e8f5e9", borderWidth: 1 },
  avatar: { width: 34, height: 34, borderRadius: 17, marginHorizontal: 7, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: "#fff", fontWeight: "bold", fontSize: 15, marginTop: 2 },
  bubbleContent: { flex: 1 },
  bubbleHeader: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
  bubbleUser: { fontWeight: "700", color: "#357c2c", fontSize: 14, marginRight: 8 },
  bubbleTime: { color: "#659d55", fontSize: 12, fontWeight: "600" },
  bubbleText: { fontSize: 16, color: "#263a2b", marginBottom: 3, lineHeight: 21 },
  bubbleImage: { width: 180, height: 110, borderRadius: 7, marginTop: 4 },
  // Empty State
  emptyState: { alignItems: "center", marginVertical: 45, flex: 1, justifyContent: "center" },
  emptyStateText: { color: "#8ba893", fontSize: 17, marginTop: 7, fontWeight: "600" }
});

export default CommunityScreen;
