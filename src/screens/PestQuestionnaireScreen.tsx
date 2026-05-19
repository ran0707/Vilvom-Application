import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

interface QuestionnaireData {
  isFirstTimeUpload: boolean;
  acreSize: number;
  lastPesticideUse: string;
}

const PestQuestionnaireScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>({
    isFirstTimeUpload: true,
    acreSize: 1,
    lastPesticideUse: '',
  });

  const pesticideOptions = [
    'Never used',
    'Less than 1 week ago',
    '1-2 weeks ago',
    '3-4 weeks ago',
    '1-2 months ago',
    'More than 2 months ago',
  ];

  const handleSubmit = () => {
    if (!questionnaire.lastPesticideUse) {
      Alert.alert('Required', 'Please select when you last used pesticide.');
      return;
    }

    // Navigate to PestResultScreen with questionnaire data
    const params = (route as any).params || {};
    (navigation as any).navigate('PestResult', {
      ...params,
      questionnaire,
    });
  };

  const incrementAcre = () => {
    setQuestionnaire(prev => ({
      ...prev,
      acreSize: Math.min(prev.acreSize + 1, 100),
    }));
  };

  const decrementAcre = () => {
    setQuestionnaire(prev => ({
      ...prev,
      acreSize: Math.max(prev.acreSize - 1, 0.5),
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Pest Analysis Survey</Text>

        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Help us provide better recommendations by answering these questions
          about your tea plantation.
        </Text>

        {/* Question 1: First time upload */}
        <View style={styles.questionCard}>
          <Text style={styles.questionTitle}>
            Is this your first time uploading an image of this leaf/pest?
          </Text>

          <View style={styles.optionContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                questionnaire.isFirstTimeUpload && styles.optionSelected,
              ]}
              onPress={() =>
                setQuestionnaire(prev => ({ ...prev, isFirstTimeUpload: true }))
              }
            >
              <Text
                style={[
                  styles.optionText,
                  questionnaire.isFirstTimeUpload && styles.optionTextSelected,
                ]}
              >
                Yes, First Time
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                !questionnaire.isFirstTimeUpload && styles.optionSelected,
              ]}
              onPress={() =>
                setQuestionnaire(prev => ({
                  ...prev,
                  isFirstTimeUpload: false,
                }))
              }
            >
              <Text
                style={[
                  styles.optionText,
                  !questionnaire.isFirstTimeUpload && styles.optionTextSelected,
                ]}
              >
                No, Rechecking
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Question 2: Acre size */}
        <View style={styles.questionCard}>
          <Text style={styles.questionTitle}>
            What is the size of your tea plantation?
          </Text>

          <View style={styles.acreContainer}>
            <TouchableOpacity style={styles.acreButton} onPress={decrementAcre}>
              <Icon name="remove" size={24} color="#4CAF50" />
            </TouchableOpacity>

            <View style={styles.acreDisplay}>
              <Text style={styles.acreValue}>{questionnaire.acreSize}</Text>
              <Text style={styles.acreUnit}>acres</Text>
            </View>

            <TouchableOpacity style={styles.acreButton} onPress={incrementAcre}>
              <Icon name="add" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Question 3: Last pesticide use */}
        <View style={styles.questionCard}>
          <Text style={styles.questionTitle}>
            When did you last use pesticide on this area?
          </Text>

          <View style={styles.pesticideContainer}>
            {pesticideOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pesticideOption,
                  questionnaire.lastPesticideUse === option &&
                    styles.pesticideSelected,
                ]}
                onPress={() =>
                  setQuestionnaire(prev => ({
                    ...prev,
                    lastPesticideUse: option,
                  }))
                }
              >
                <Text
                  style={[
                    styles.pesticideText,
                    questionnaire.lastPesticideUse === option &&
                      styles.pesticideTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <LinearGradient
            colors={['#4CAF50', '#2E7D32']}
            style={styles.submitGradient}
          >
            <Text style={styles.submitText}>Analyze Pest</Text>
            <Icon name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.noteContainer}>
          <Icon name="info" size={20} color="#666" />
          <Text style={styles.noteText}>
            Your responses help us provide more accurate pest control
            recommendations and track pest patterns in your region.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  optionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f0',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#4CAF50',
  },
  acreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  acreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acreDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  acreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  acreUnit: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  pesticideContainer: {
    gap: 8,
  },
  pesticideOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pesticideSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f0',
  },
  pesticideText: {
    fontSize: 14,
    color: '#666',
  },
  pesticideTextSelected: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  submitButton: {
    marginVertical: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
    gap: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default PestQuestionnaireScreen;
