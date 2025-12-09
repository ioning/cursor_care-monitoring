import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchWard, uploadAvatar } from '../store/slices/wardSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { format } from 'date-fns';

const GuardianWardDetailScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const route = useRoute();
  const navigation = useNavigation();
  const { wardId } = (route.params as any) || {};
  const { currentWard, isLoading } = useSelector((state: RootState) => state.ward);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (wardId) {
      dispatch(fetchWard(wardId));
    }
  }, [dispatch, wardId]);

  const calculateAge = (dateOfBirth?: string): number | null => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleImagePicker = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('Ошибка', 'Не удалось выбрать изображение');
          return;
        }
        if (response.assets && response.assets[0] && wardId) {
          uploadImage(response.assets[0].uri!);
        }
      },
    );
  };

  const uploadImage = async (imageUri: string) => {
    if (!wardId) return;

    setUploading(true);
    try {
      await dispatch(uploadAvatar({ wardId, imageUri })).unwrap();
      Alert.alert('Успешно', 'Аватар обновлен');
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить аватар');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading && !currentWard) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!currentWard) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Подопечный не найден</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Детали подопечного</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.avatarSection}>
        <TouchableOpacity
          onPress={handleImagePicker}
          disabled={uploading}
          style={styles.avatarContainer}
        >
          {currentWard.avatarUrl ? (
            <Image source={{ uri: currentWard.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{currentWard.fullName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {uploading ? (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          ) : (
            <View style={styles.editIconContainer}>
              <Icon name="camera-alt" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.wardName}>{currentWard.fullName}</Text>
        <View style={styles.wardMeta}>
          {currentWard.dateOfBirth && (
            <Text style={styles.metaText}>
              {calculateAge(currentWard.dateOfBirth)} лет
            </Text>
          )}
          {currentWard.gender && (
            <Text style={styles.metaText}>
              {currentWard.gender === 'male' ? 'Мужской' : 'Женский'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Информация</Text>
        {currentWard.dateOfBirth && (
          <View style={styles.infoRow}>
            <Icon name="cake" size={20} color="#666" />
            <Text style={styles.infoText}>
              {format(new Date(currentWard.dateOfBirth), 'dd.MM.yyyy')}
            </Text>
          </View>
        )}
        {currentWard.emergencyContact && (
          <View style={styles.infoRow}>
            <Icon name="phone" size={20} color="#666" />
            <Text style={styles.infoText}>{currentWard.emergencyContact}</Text>
          </View>
        )}
        {currentWard.relationship && (
          <View style={styles.infoRow}>
            <Icon name="people" size={20} color="#666" />
            <Text style={styles.infoText}>{currentWard.relationship}</Text>
          </View>
        )}
      </View>

      {currentWard.medicalInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Медицинская информация</Text>
          <Text style={styles.medicalText}>{currentWard.medicalInfo}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('WardTelemetry' as never, { wardId } as never)}
        >
          <Icon name="show-chart" size={24} color="#2196F3" />
          <Text style={styles.actionText}>Показатели</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('WardAlerts' as never, { wardId } as never)}
        >
          <Icon name="notifications" size={24} color="#2196F3" />
          <Text style={styles.actionText}>Алерты</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('WardLocation' as never, { wardId } as never)}
        >
          <Icon name="location-on" size={24} color="#2196F3" />
          <Text style={styles.actionText}>Геолокация</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatarSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2196F3',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  wardMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  medicalText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
  },
});

export default GuardianWardDetailScreen;


import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchWard, uploadAvatar } from '../store/slices/wardSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { format } from 'date-fns';

const GuardianWardDetailScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const route = useRoute();
  const navigation = useNavigation();
  const { wardId } = (route.params as any) || {};
  const { currentWard, isLoading } = useSelector((state: RootState) => state.ward);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (wardId) {
      dispatch(fetchWard(wardId));
    }
  }, [dispatch, wardId]);

  const calculateAge = (dateOfBirth?: string): number | null => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleImagePicker = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('Ошибка', 'Не удалось выбрать изображение');
          return;
        }
        if (response.assets && response.assets[0] && wardId) {
          uploadImage(response.assets[0].uri!);
        }
      },
    );
  };

  const uploadImage = async (imageUri: string) => {
    if (!wardId) return;

    setUploading(true);
    try {
      await dispatch(uploadAvatar({ wardId, imageUri })).unwrap();
      Alert.alert('Успешно', 'Аватар обновлен');
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить аватар');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading && !currentWard) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!currentWard) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Подопечный не найден</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Детали подопечного</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.avatarSection}>
        <TouchableOpacity
          onPress={handleImagePicker}
          disabled={uploading}
          style={styles.avatarContainer}
        >
          {currentWard.avatarUrl ? (
            <Image source={{ uri: currentWard.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{currentWard.fullName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {uploading ? (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          ) : (
            <View style={styles.editIconContainer}>
              <Icon name="camera-alt" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.wardName}>{currentWard.fullName}</Text>
        <View style={styles.wardMeta}>
          {currentWard.dateOfBirth && (
            <Text style={styles.metaText}>
              {calculateAge(currentWard.dateOfBirth)} лет
            </Text>
          )}
          {currentWard.gender && (
            <Text style={styles.metaText}>
              {currentWard.gender === 'male' ? 'Мужской' : 'Женский'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Информация</Text>
        {currentWard.dateOfBirth && (
          <View style={styles.infoRow}>
            <Icon name="cake" size={20} color="#666" />
            <Text style={styles.infoText}>
              {format(new Date(currentWard.dateOfBirth), 'dd.MM.yyyy')}
            </Text>
          </View>
        )}
        {currentWard.emergencyContact && (
          <View style={styles.infoRow}>
            <Icon name="phone" size={20} color="#666" />
            <Text style={styles.infoText}>{currentWard.emergencyContact}</Text>
          </View>
        )}
        {currentWard.relationship && (
          <View style={styles.infoRow}>
            <Icon name="people" size={20} color="#666" />
            <Text style={styles.infoText}>{currentWard.relationship}</Text>
          </View>
        )}
      </View>

      {currentWard.medicalInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Медицинская информация</Text>
          <Text style={styles.medicalText}>{currentWard.medicalInfo}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('WardTelemetry' as never, { wardId } as never)}
        >
          <Icon name="show-chart" size={24} color="#2196F3" />
          <Text style={styles.actionText}>Показатели</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('WardAlerts' as never, { wardId } as never)}
        >
          <Icon name="notifications" size={24} color="#2196F3" />
          <Text style={styles.actionText}>Алерты</Text>
        </Tou                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             