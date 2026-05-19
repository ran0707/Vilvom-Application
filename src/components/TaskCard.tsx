import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

interface TaskCardProps {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  time: string;
}

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
  },
  taskTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  taskSubtitle: { fontSize: 12, color: '#777' },
  taskTime: { fontSize: 13, fontWeight: '600', color: '#4CAF50' },
});

const TaskCard: React.FC<TaskCardProps> = ({
  icon,
  iconColor,
  title,
  subtitle,
  time,
}) => (
  <View style={styles.taskCard}>
    <Icon name={icon} size={20} color={iconColor} style={{ marginRight: 10 }} />
    <View style={{ flex: 1 }}>
      <Text style={styles.taskTitle}>{title}</Text>
      <Text style={styles.taskSubtitle}>{subtitle}</Text>
    </View>
    <Text style={styles.taskTime}>{time}</Text>
  </View>
);

export default TaskCard;
