// app/medicine-list.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from '@expo/vector-icons'; // Установите пакет @expo/vector-icons

export interface Medicine {
  id: string;
  name: string;
  quantity: number;
  dosage: string;
  expirationDate: string;
  category: string;
  isFavorite: boolean;
  image: string | null;
}

const MedicineListScreen: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadMedicines = async () => {
    try {
      const storedMedicines = await AsyncStorage.getItem('medicines');
      if (storedMedicines) {
        setMedicines(JSON.parse(storedMedicines));
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить список лекарств');
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMedicines();
    }, [])
  );

  const deleteMedicine = async (id: string) => {
    Alert.alert(
      'Удаление лекарства',
      'Вы уверены, что хотите удалить это лекарство?',
      [
        {
          text: 'Отмена',
          style: 'cancel'
        },
        {
          text: 'Удалить',
          onPress: async () => {
            try {
              const updated = medicines.filter(medicine => medicine.id !== id);
              await AsyncStorage.setItem('medicines', JSON.stringify(updated));
              setMedicines(updated);
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить лекарство');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const toggleFavorite = async (id: string) => {
    const updated = medicines.map(medicine => 
      medicine.id === id ? { ...medicine, isFavorite: !medicine.isFavorite } : medicine
    );
    try {
      await AsyncStorage.setItem('medicines', JSON.stringify(updated));
      setMedicines(updated);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить избранное');
    }
  };

  const renderItem = ({ item }: { item: Medicine }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.name}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
            <AntDesign 
              name={item.isFavorite ? 'star' : 'staro'} 
              size={24} 
              color={item.isFavorite ? '#FFD700' : '#C0C0C0'} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteMedicine(item.id)}>
            <AntDesign name="delete" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.details}>
        <Text>Количество: {item.quantity}</Text>
        <Text>Дозировка: {item.dosage}</Text>
        <Text>Годен до: {item.expirationDate}</Text>
        <Text>Категория: {item.category}</Text>
      </View>

      {item.image && (
        <Image source={{ uri: item.image }} style={styles.image} />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={medicines}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadMedicines}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Список лекарств пуст</Text>
            <Link href="/AddMedicine" asChild>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.buttonText}>Добавить лекарство</Text>
              </TouchableOpacity>
            </Link>
          </View>
        }
      />

      <Link href="/AddMedicine" asChild>
        <TouchableOpacity style={styles.fab}>
          <AntDesign name="plus" size={24} color="white" />
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1
  },
  actions: {
    flexDirection: 'row',
    gap: 16
  },
  details: {
    gap: 4,
    marginBottom: 12
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  emptyText: {
    fontSize: 16,
    color: '#666'
  },
  addButton: {
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8
  },
  buttonText: {
    color: 'white'
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4
  }
});

export default MedicineListScreen;