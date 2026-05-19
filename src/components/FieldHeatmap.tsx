import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type FieldPoint = {
  lat: number;
  lng: number;
  intensity?: number; // 0..1
};

interface Props {
  points: FieldPoint[];
  width?: number;
  height?: number;
}

// Simple heatmap renderer without external map libs.
// It computes bounding box of lat/lng and places colored circles proportionally.
const FieldHeatmap: React.FC<Props> = ({
  points,
  width = 220,
  height = 140,
}) => {
  if (!points || points.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.emptyText}>No field coordinates available</Text>
      </View>
    );
  }

  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  const mapped = points.map((p, i) => {
    const x = ((p.lng - minLng) / lngRange) * (width - 12) + 6; // padding
    const y = (1 - (p.lat - minLat) / latRange) * (height - 12) + 6; // invert y so larger lat -> top
    const intensity = Math.max(0.05, Math.min(1, p.intensity ?? 0.6));
    return { ...p, x, y, intensity, key: `pt-${i}` };
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.mapArea} />
      {mapped.map(m => (
        <View
          key={m.key}
          style={[
            styles.heatDot,
            {
              left: m.x - 25,
              top: m.y - 25,
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: `rgba(255,0,0,${0.15 + m.intensity * 0.6})`,
              borderWidth: 1,
              borderColor: `rgba(255,0,0,${0.25 + m.intensity * 0.4})`,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapArea: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f2f7f2',
  },
  heatDot: {
    position: 'absolute',
  },
  emptyText: {
    color: '#666',
    fontSize: 12,
  },
});

export default FieldHeatmap;
