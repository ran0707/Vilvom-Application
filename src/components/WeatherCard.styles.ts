import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  weatherCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 160,
  },

  // Main weather container
  mainWeatherContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },

  // Temperature section (left side)
  temperatureSection: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 100,
  },

  tempText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#222',
    marginTop: 8,
    marginBottom: 4,
  },

  feelsLikeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  // Details section (right side)
  detailsSection: {
    flex: 1,
    justifyContent: 'flex-start',
  },

  weatherDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    lineHeight: 20,
    marginBottom: 12,
  },

  viewDetailsText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 13,
  },

  // Weather stats container
  weatherStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#D0E7D2',
  },

  weatherStat: {
    alignItems: 'center',
    flex: 1,
  },

  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    marginTop: 4,
    marginBottom: 2,
  },

  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },

  // Loading state
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },

  loadingText: {
    marginTop: 12,
    color: '#777',
    fontSize: 14,
  },

  // Error state
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },

  errorText: {
    marginTop: 12,
    color: '#777',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },

  errorSubText: {
    marginTop: 8,
    color: '#999',
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 20,
  },

  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },

  retryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },

  // Legacy styles (keeping for compatibility)
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    width: '100%',
  },
  weatherSmallRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherInfoSmall: { alignItems: 'center', marginLeft: 6, marginRight: 6 },
  weatherInfoSmallCenter: { alignItems: 'center' },
  weatherInfo: { alignItems: 'center', flex: 1 },
  weatherLabel: { fontSize: 16, fontWeight: '700', color: '#111' },
  weatherValue: { fontSize: 12, color: '#777' },
});
