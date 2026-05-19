import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface StarRatingProps {
  maxStars?: number;
  rating?: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  color?: string;
  showText?: boolean;
  disabled?: boolean;
  title?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  maxStars = 5,
  rating = 0,
  onRatingChange,
  size = 32,
  color = '#FFD700',
  showText = true,
  disabled = false,
  title = 'Rate this service',
}) => {
  const [currentRating, setCurrentRating] = useState(rating);
  const [animatedValues] = useState(
    Array.from({ length: maxStars }, () => new Animated.Value(1)),
  );

  const handleStarPress = (starIndex: number) => {
    if (disabled) return;

    const newRating = starIndex + 1;
    setCurrentRating(newRating);
    onRatingChange?.(newRating);

    // Animate the pressed star
    Animated.sequence([
      Animated.timing(animatedValues[starIndex], {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues[starIndex], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getRatingText = (rating: number) => {
    if (rating === 0) return 'No rating';
    if (rating === 1) return 'Poor';
    if (rating === 2) return 'Fair';
    if (rating === 3) return 'Good';
    if (rating === 4) return 'Very Good';
    if (rating === 5) return 'Excellent';
    return `${rating} stars`;
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View style={styles.starsContainer}>
        {Array.from({ length: maxStars }, (_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleStarPress(index)}
            disabled={disabled}
            style={[styles.starButton, disabled && styles.disabledStar]}
            activeOpacity={0.7}
          >
            <Animated.View
              style={{
                transform: [{ scale: animatedValues[index] }],
              }}
            >
              <Icon
                name={index < currentRating ? 'star' : 'star-o'}
                size={size}
                color={index < currentRating ? color : '#C0C0C0'}
              />
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>

      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.ratingText, disabled && styles.disabledText]}>
            {getRatingText(currentRating)}
          </Text>
          <Text style={[styles.scoreText, disabled && styles.disabledText]}>
            {currentRating > 0 ? `${currentRating}/${maxStars}` : ''}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  disabledStar: {
    opacity: 0.6,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 14,
    color: '#666',
  },
  disabledText: {
    color: '#999',
  },
});

export default StarRating;
