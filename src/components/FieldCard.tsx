import React from 'react';
import { View, Text, Image } from 'react-native';

interface FieldCardProps {
  image: string;
  status: string;
  statusType: 'good' | 'bad';
  name: string;
  area: string;
}

const styles = {
  fieldCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginRight: 16,
    width: 160,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fieldImage: {
    width: 160,
    height: 95,
    borderRadius: 12,
    marginBottom: 8,
  },
  fieldStatusGood: {
    backgroundColor: '#C8E6C9',
    color: '#2E7D32',
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start' as 'flex-start',
    marginBottom: 4,
  },
  fieldStatusBad: {
    backgroundColor: '#FFCDD2',
    color: '#C62828',
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start' as 'flex-start',
    marginBottom: 4,
  },
  fieldName: { fontSize: 14, fontWeight: '600' as '600', marginTop: 4 },
  fieldArea: { fontSize: 12, color: '#777' },
};

const FieldCard: React.FC<FieldCardProps> = ({
  image,
  status,
  statusType,
  name,
  area,
}) => (
  <View style={styles.fieldCard}>
    <Image source={{ uri: image }} style={styles.fieldImage} />
    <Text
      style={
        statusType === 'good' ? styles.fieldStatusGood : styles.fieldStatusBad
      }
    >
      {status}
    </Text>
    <Text style={styles.fieldName}>{name}</Text>
    <Text style={styles.fieldArea}>{area}</Text>
  </View>
);

export default FieldCard;
