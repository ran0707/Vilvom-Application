import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface SellerFormData {
  storeName: string;
  businessEmail: string;
  businessPhone: string;
  taxId: string;
  panNumber: string;
  gstNumber: string;
  pickupAddress: string;
  city: string;
  state: string;
  pincode: string;
  bankAccountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
  shippingPreference: 'self' | 'partner' | 'both';
}

const BecomeSellerScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<SellerFormData>({
    storeName: '',
    businessEmail: '',
    businessPhone: '',
    taxId: '',
    panNumber: '',
    gstNumber: '',
    pickupAddress: '',
    city: '',
    state: '',
    pincode: '',
    bankAccountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: '',
    shippingPreference: 'partner',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const updateFormData = (field: keyof SellerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // For now, just show an alert
    Alert.alert(
      'Application Submitted!',
      'Your seller account application has been submitted. We will review your details and contact you within 2-3 business days.',
      [
        {
          text: 'OK',
          onPress: () => (navigation as any).goBack(),
        },
      ],
    );
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map(step => (
        <View key={step} style={styles.stepContainer}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step ? styles.activeStep : styles.inactiveStep,
            ]}
          >
            <Text
              style={[
                styles.stepText,
                currentStep >= step
                  ? styles.activeStepText
                  : styles.inactiveStepText,
              ]}
            >
              {step}
            </Text>
          </View>
          {step < totalSteps && (
            <View
              style={[
                styles.stepLine,
                currentStep > step ? styles.activeLine : styles.inactiveLine,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Store Information</Text>
      <Text style={styles.stepDescription}>
        Tell us about your business and store details
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Store Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.storeName}
          onChangeText={text => updateFormData('storeName', text)}
          placeholder="Enter your store name"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Email *</Text>
        <TextInput
          style={styles.input}
          value={formData.businessEmail}
          onChangeText={text => updateFormData('businessEmail', text)}
          placeholder="business@example.com"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Phone *</Text>
        <TextInput
          style={styles.input}
          value={formData.businessPhone}
          onChangeText={text => updateFormData('businessPhone', text)}
          placeholder="+91 98765 43210"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tax Details</Text>
      <Text style={styles.stepDescription}>
        Provide your tax identification details for verification
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>PAN Number *</Text>
        <TextInput
          style={styles.input}
          value={formData.panNumber}
          onChangeText={text => updateFormData('panNumber', text.toUpperCase())}
          placeholder="ABCDE1234F"
          placeholderTextColor="#999"
          autoCapitalize="characters"
          maxLength={10}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>GST Number</Text>
        <TextInput
          style={styles.input}
          value={formData.gstNumber}
          onChangeText={text => updateFormData('gstNumber', text.toUpperCase())}
          placeholder="22AAAAA0000A1Z5 (Optional)"
          placeholderTextColor="#999"
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tax ID / TIN</Text>
        <TextInput
          style={styles.input}
          value={formData.taxId}
          onChangeText={text => updateFormData('taxId', text)}
          placeholder="Tax identification number"
          placeholderTextColor="#999"
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Shipping & Pickup Address</Text>
      <Text style={styles.stepDescription}>
        Where should customers pick up orders or where should we collect items?
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Shipping Preference *</Text>
        <View style={styles.radioGroup}>
          {[
            { value: 'self', label: 'Self shipping' },
            { value: 'partner', label: 'Partner with delivery service' },
            { value: 'both', label: 'Both options' },
          ].map(option => (
            <TouchableOpacity
              key={option.value}
              style={styles.radioOption}
              onPress={() =>
                updateFormData('shippingPreference', option.value as any)
              }
            >
              <View style={styles.radioCircle}>
                {formData.shippingPreference === option.value && (
                  <View style={styles.radioSelected} />
                )}
              </View>
              <Text style={styles.radioLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pickup Address *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.pickupAddress}
          onChangeText={text => updateFormData('pickupAddress', text)}
          placeholder="Complete address with landmarks"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={formData.city}
            onChangeText={text => updateFormData('city', text)}
            placeholder="City"
            placeholderTextColor="#999"
          />
        </View>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            value={formData.state}
            onChangeText={text => updateFormData('state', text)}
            placeholder="State"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>PIN Code *</Text>
        <TextInput
          style={[styles.input, { width: '40%' }]}
          value={formData.pincode}
          onChangeText={text => updateFormData('pincode', text)}
          placeholder="123456"
          placeholderTextColor="#999"
          keyboardType="numeric"
          maxLength={6}
        />
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Bank Details</Text>
      <Text style={styles.stepDescription}>
        Add your bank account details for payment processing
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Account Holder Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.accountHolderName}
          onChangeText={text => updateFormData('accountHolderName', text)}
          placeholder="As per bank records"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Bank Account Number *</Text>
        <TextInput
          style={styles.input}
          value={formData.bankAccountNumber}
          onChangeText={text => updateFormData('bankAccountNumber', text)}
          placeholder="1234567890123456"
          placeholderTextColor="#999"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>IFSC Code *</Text>
        <TextInput
          style={styles.input}
          value={formData.ifscCode}
          onChangeText={text => updateFormData('ifscCode', text.toUpperCase())}
          placeholder="ABCD0123456"
          placeholderTextColor="#999"
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Bank Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.bankName}
          onChangeText={text => updateFormData('bankName', text)}
          placeholder="State Bank of India"
          placeholderTextColor="#999"
        />
      </View>
    </View>
  );

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation as any).goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Seller</Text>
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {getCurrentStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handlePrevious}
          >
            <Text style={styles.secondaryButtonText}>Previous</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            currentStep === 1 && styles.fullWidthButton,
          ]}
          onPress={currentStep === totalSteps ? handleSubmit : handleNext}
        >
          <Text style={styles.primaryButtonText}>
            {currentStep === totalSteps ? 'Submit Application' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fdf9',
  },
  header: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    backgroundColor: '#4CAF50',
  },
  inactiveStep: {
    backgroundColor: '#E0E0E0',
  },
  stepText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeStepText: {
    color: '#fff',
  },
  inactiveStepText: {
    color: '#999',
  },
  stepLine: {
    width: 30,
    height: 2,
    marginHorizontal: 8,
  },
  activeLine: {
    backgroundColor: '#4CAF50',
  },
  inactiveLine: {
    backgroundColor: '#E0E0E0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  radioGroup: {
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  fullWidthButton: {
    marginLeft: 0,
  },
});

export default BecomeSellerScreen;
