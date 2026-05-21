import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const BTN_COLOR    = '#2E7D32';
const BTN_DISABLED = '#A5D6A7';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const LeafButton: React.FC<Props> = ({ label, onPress, loading = false, disabled = false }) => {
  const isDisabled = (disabled || loading) && !loading;
  const bg = disabled && !loading ? BTN_DISABLED : BTN_COLOR;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[styles.btn, { backgroundColor: bg }]}
    >
      <Text style={styles.label}>{loading ? 'Please wait…' : label}</Text>
      <MaterialCommunityIcons
        name="leaf"
        size={22}
        color="rgba(255,255,255,0.75)"
        style={styles.icon}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    alignSelf: 'center',
    width: '72%',
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  icon: {
    marginLeft: 10,
  },
});

export default LeafButton;
