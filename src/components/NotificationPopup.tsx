import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { styles } from './NotificationPopup.styles';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  icon: string;
  color: string;
}

interface NotificationPopupProps {
  visible: boolean;
  opacityAnim: Animated.Value;
  scaleAnim: Animated.Value;
  notifications: Notification[];
  onClose: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  visible,
  opacityAnim,
  scaleAnim,
  notifications,  
  onClose,
}) => (
  <Modal
  visible={visible}
  transparent
  animationType="none"
  onRequestClose={onClose}
>
  <View style={styles.modalOverlay}>
    <Animated.View
      style={[
        styles.notificationPopup,
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            {
              translateY: opacityAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.popupHeader}>
        <Text style={styles.popupTitle}>Notifications</Text>
        <TouchableOpacity onPress={onClose}>
          <Icon name="times" size={18} color="#777" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.notificationList}>
        {notifications.map(notification => (
          <View key={notification.id} style={styles.notificationItem}>
            <View
              style={[
                styles.notifIcon,
                { backgroundColor: notification.color },
              ]}
            >
              <Icon name={notification.icon} size={16} color="#fff" />
            </View>
            <View style={styles.notifContent}>
              <Text style={styles.notifTitle}>{notification.title}</Text>
              <Text style={styles.notifMessage}>{notification.message}</Text>
              <Text style={styles.notifTime}>{notification.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  </View>
</Modal>

);

export default NotificationPopup;
