import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { createWard } from '../store/slices/wardSlice';
import { useNavigation } from '@react-navigation/native';

const CreateWardScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { isLoading } = useSelector((state: RootState) => state.ward);

  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    medicalInfo: '',
    emergencyContact: '',
    relationship: '',
  });

  const handleSubmit = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Ошибка', 'Имя обязательно для заполнения');
      return;
    }

    try {
      const result = await dispatch(createWard(formData)).unwrap();
      Alert.alert('Успешно', 'Подопечный создан', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
            navigation.navigate('WardDetail' as never, { wardId: result.id } as never);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось создать подопечного');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Добавить подопечного</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Полное имя *</Text>
          <TextInput
            style={styles.input}
            value={formData.fullName}
            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            placeholder="Введите полное имя"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Дата рождения</Text>
          <TextInput
            style={styles.input}
            value={formData.dateOfBirth}
            onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Пол</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                formData.gender === 'male' && styles.radioButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, gender: 'male' })}
            >
              <Text
                style={[
                  styles.radioText,
                  formData.gender === 'male' && styles.radioTextActive,
                ]}
              >
                Мужской
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioButton,
                formData.gender === 'female' && styles.radioButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, gender: 'female' })}
            >
              <Text
                style={[
                  styles.radioText,
                  formData.gender === 'female' && styles.radioTextActive,
                ]}
              >
                Женский
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Родственная связь</Text>
          <TextInput
            style={styles.input}
            value={formData.relationship}
            onChangeText={(text) => setFormData({ ...formData, relationship: text })}
            placeholder="Например: мать, отец, сын"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Медицинская информация</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.medicalInfo}
            onChangeText={(text) => setFormData({ ...formData, medicalInfo: text })}
            placeholder="Аллергии, хронические заболевания и т.д."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Экстренный контакт</Text>
          <TextInput
            style={styles.input}
            value={formData.emergencyContact}
            onChangeText={(text) => setFormData({ ...formData, emergencyContact: text })}
            placeholder="Телефон или email"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Создать</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  radioButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  radioText: {
    fontSize: 16,
    color: '#666',
  },
  radioTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateWardScreen;
