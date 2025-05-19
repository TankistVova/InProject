// app/category-screen.tsx
import React, { useState, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, RefreshControl, Image 
} from 'react-native';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from '@expo/vector-icons';

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

const CategoryScreen: React.FC = () => {
  const { categoryId, categoryName } = useLocalSearchParams<{ categoryId: string; categoryName?: string }>();
  const router = useRouter();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Загрузка и фильтрация лекарств по категории
  const loadMedicines = async () => {
    try {
      setRefreshing(true);
      const storedMedicines = await AsyncStorage.getItem('medicines');
      if (storedMedicines) {
        const allMedicines: Medicine[] = JSON.parse(storedMedicines);
        const filtered = categoryId === '0' 
          ? allMedicines 
          : allMedicines.filter(med => med.category === categoryName);
        setMedicines(filtered);
      } else {
        setMedicines([]);
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
    }, [categoryId, categoryName])
  );

  const deleteMedicine = async (id: string) => {
    Alert.alert(
      'Удаление лекарства',
      'Вы уверены, что хотите удалить это лекарство?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          onPress: async () => {
            try {
              const updated = medicines.filter(med => med.id !== id);
              await AsyncStorage.setItem('medicines', JSON.stringify(updated));
              setMedicines(updated);
            } catch {
              Alert.alert('Ошибка', 'Не удалось удалить лекарство');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const toggleFavorite = async (id: string) => {
    const updated = medicines.map(med =>
      med.id === id ? { ...med, isFavorite: !med.isFavorite } : med
    );
    try {
      await AsyncStorage.setItem('medicines', JSON.stringify(updated));
      setMedicines(updated);
    } catch {
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
            <AntDesign name="delete" size={24} color="#39798F" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.details}>
        <Text>Количество: {item.quantity}</Text>
        <Text>Дозировка: {item.dosage}</Text>
        <Text>Годен до: {item.expirationDate}</Text>
        <Text>Категория: {item.category}</Text>
      </View>

      {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#39798F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName || 'Категория'}</Text>
      </View>

      <FlatList
        data={medicines}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadMedicines} />}
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
        contentContainerStyle={{ paddingBottom: 100 }}
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#39798F',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  details: {
    gap: 4,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  addButton: {
    padding: 12,
    backgroundColor: '#39798F',
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    backgroundColor: '#39798F',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});

export default CategoryScreen;
