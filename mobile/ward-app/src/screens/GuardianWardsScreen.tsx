import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchWards, deleteWard } from '../store/slices/wardSlice';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';

const GuardianWardsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { wards, isLoading } = useSelector((state: RootState) => state.ward);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchWards());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchWards());
    setRefreshing(false);
  };

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

  const handleDelete = (wardId: string, wardName: string) => {
    Alert.alert(
      'Удалить подопечного',
      `Вы уверены, что хотите удалить ${wardName}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => dispatch(deleteWard(wardId)),
        },
      ],
    );
  };

  const handleWardPress = (wardId: string) => {
    navigation.navigate('WardDetail' as never, { wardId } as never);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Подопечные</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateWard' as never)}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading && wards.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      ) : wards.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Нет подопечных</Text>
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={() => navigation.navigate('CreateWard' as never)}
          >
            <Text style={styles.addFirstButtonText}>Добавить первого подопечного</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.wardsList}>
          {wards.map((ward) => (
            <TouchableOpacity
              key={ward.id}
              style={styles.wardCard}
              onPress={() => handleWardPress(ward.id)}
            >
              <View style={styles.wardCardContent}>
                {ward.avatarUrl ? (
                  <Image source={{ uri: ward.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{ward.fullName.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.wardInfo}>
                  <Text style={styles.wardName}>{ward.fullName}</Text>
                  <View style={styles.wardDetails}>
                    {ward.dateOfBirth && (
                      <Text style={styles.wardDetail}>
                        {calculateAge(ward.dateOfBirth)} лет
                      </Text>
                    )}
                    {ward.gender && (
                      <Text style={styles.wardDetail}>
                        {ward.gender === 'male' ? 'Мужской' : 'Женский'}
                      </Text>
                    )}
                  </View>
                  {ward.medicalInfo && (
                    <View style={styles.medicalBadge}>
                      <Icon name="medical-services" size={14} color="#2196F3" />
                      <Text style={styles.medicalText}>Медицинская информация</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(ward.id, ward.fullName)}
                >
                  <Icon name="delete" size={20} color="#f44336" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  wardsList: {
    padding: 16,
  },
  wardCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wardCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  wardInfo: {
    flex: 1,
  },
  wardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  wardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  wardDetail: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  medicalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  medicalText: {
    fontSize: 12,
    color: '#2196F3',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 8,
  },
});

export default GuardianWardsScreen;
