import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  FlatList,
  Platform
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, Feather, FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

interface Medicine {
  id: string;
  name: string;
  quantity: number;
  dosage: string;
  expirationDate: string;
  category: string;
  isFavorite: boolean;
  image: string | null;
  createdAt: string;
}

type FormState = {
  name: string;
  quantity: string;
  dosage: string;
  expirationDate: string;
  category: string;
  isFavorite: boolean;
  image: string | null;
}

const DEFAULT_CATEGORIES = [
  'От простуды',
  'От боли',
  'От аллергии',
  'Для желудка',
  'Для сердца',
  'Для иммунитета',
  'Антистресс',
  'Витамины',
  'Противовирусные',
  'Другое'
];

const CATEGORY_COLORS = [
  '#ECF0F1', '#ECF0F1', '#ECF0F1', '#ECF0F1',
  '#ECF0F1', '#ECF0F1', '#ECF0F1', '#ECF0F1'
];

const getCategoryColor = (category: string, categories: string[]) => {
  const index = categories.indexOf(category) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
};

const ManualAddScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const isEditMode = params.editMode === 'true';
  
  const [form, setForm] = useState<FormState>({
    name: '',
    quantity: '0',
    dosage: '',
    expirationDate: '',
    category: '',
    isFavorite: false,
    image: null
  });

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  const routeParams = useMemo(() => ({
    scannedName: params.scannedName?.toString() || '',
    scannedQuantity: params.scannedQuantity?.toString() || '0',
    category: params.category?.toString() || '',
    image: params.image?.toString() || null,
    isFavorite: params.isFavorite === 'true',
    id: params.id?.toString()
  }), [
    params.scannedName,
    params.scannedQuantity,
    params.category,
    params.image,
    params.isFavorite,
    params.id
  ]);

  useEffect(() => {
    const shouldUpdate = 
      routeParams.scannedName !== form.name ||
      routeParams.scannedQuantity !== form.quantity ||
      routeParams.category !== form.category ||
      routeParams.image !== form.image ||
      routeParams.isFavorite !== form.isFavorite;

    if (shouldUpdate) {
      setForm(prev => ({
        ...prev,
        name: routeParams.scannedName,
        quantity: routeParams.scannedQuantity,
        category: routeParams.category,
        image: routeParams.image,
        isFavorite: routeParams.isFavorite
      }));
    }
  }, [routeParams]);

  useEffect(() => {
    if (form.expirationDate) {
      const [dd, mm, yyyy] = form.expirationDate.split('.');
      if (dd && mm && yyyy) {
        setDate(new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd)));
      }
    }
  }, [form.expirationDate]);

  const loadCategories = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('categories');
      if (!stored) return;

      const customCategories: string[] = JSON.parse(stored);
      const merged = [...new Set([...DEFAULT_CATEGORIES, ...customCategories])];
      
      setCategories(prev => {
        const prevString = JSON.stringify(prev);
        const newString = JSON.stringify(merged);
        return prevString === newString ? prev : merged;
      });
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить категории');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      if (isActive) loadCategories();
      return () => { isActive = false; };
    }, [loadCategories])
  );

  const handleSave = useCallback(async () => {
    if (!form.name.trim() || !form.quantity || !form.category) {
      Alert.alert('Ошибка', 'Заполните обязательные поля');
      return;
    }

    const newMedicine: Medicine = {
      id: routeParams.id || Date.now().toString(),
      name: form.name.trim(),
      quantity: parseInt(form.quantity, 10),
      dosage: form.dosage.trim(),
      expirationDate: form.expirationDate,
      category: form.category,
      isFavorite: form.isFavorite,
      image: form.image,
      createdAt: new Date().toISOString()
    };

    try {
      const stored = await AsyncStorage.getItem('medicines');
      const medicines: Medicine[] = stored ? JSON.parse(stored) : [];
      
      const updatedMedicines = isEditMode 
        ? medicines.map(m => m.id === newMedicine.id ? newMedicine : m)
        : [...medicines, newMedicine];

      await AsyncStorage.setItem('medicines', JSON.stringify(updatedMedicines));
      router.back();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить данные');
    }
  }, [form, isEditMode, routeParams.id]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Требуется доступ к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setForm(prev => ({ ...prev, image: result.assets[0].uri }));
    }
  }, []);

  const toggleFavorite = useCallback(() => {
    setForm(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
  }, []);

  const handleScanPress = useCallback(() => {
    router.push('/Scanner');
  }, []);

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    setForm(prev => ({
      ...prev,
      expirationDate: format(currentDate, 'dd.MM.yyyy')
    }));
  };

  const renderCategoryItem = useCallback(
    ({ item }: { item: string }) => {
      const bgColor = getCategoryColor(item, categories);
      
      return (
        <TouchableOpacity
          style={[
            styles.categoryButton,
            { backgroundColor: bgColor },
            form.category === item && styles.selectedCategory
          ]}
          onPress={() => setForm(prev => 
            prev.category === item ? prev : { ...prev, category: item }
          )}
        >
          <Text style={[
            styles.categoryText,
            form.category === item && styles.selectedCategoryText
          ]}>
            {item}
          </Text>
        </TouchableOpacity>
      );
    },
    [form.category, categories]
  );

  const filteredCategories = useMemo(() => 
    categories.filter(cat =>
      cat.toLowerCase().includes(searchQuery.toLowerCase())
  ), [categories, searchQuery]);

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.header}>
        {isEditMode ? 'Редактирование лекарства' : 'Добавление лекарства'}
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Название *</Text>
        <TextInput
          placeholder="Введите название препарата"
          value={form.name}
          onChangeText={name => setForm(prev => ({ ...prev, name }))}
          style={styles.input}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Количество *</Text>
        <TextInput
          placeholder="Укажите количество"
          value={form.quantity}
          onChangeText={text => 
            setForm(prev => ({ ...prev, quantity: text.replace(/\D/g, '') }))}
          keyboardType="numeric"
          style={styles.input}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Дозировка</Text>
        <TextInput
          placeholder="Укажите дозировку"
          value={form.dosage}
          onChangeText={dosage => setForm(prev => ({ ...prev, dosage }))}
          style={styles.input}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Срок годности</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {form.expirationDate || 'дд.мм.гггг'}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}
      </View>

      <View style={styles.optionsRow}>
        <TouchableOpacity 
          style={styles.optionButton}
          onPress={toggleFavorite}
        >
          <FontAwesome
            name={form.isFavorite ? 'heart' : 'heart-o'}
            size={20}
            color={form.isFavorite ? '#FF5252' : '#666'}
          />
          <Text style={styles.optionText}>В избранное</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={pickImage}
        >
          <Feather name="image" size={20} color="#666" />
          <Text style={styles.optionText}>Добавить фото</Text>
        </TouchableOpacity>
      </View>

      {/* Полноразмерная кнопка сканирования */}
      <TouchableOpacity
        style={styles.fullWidthButton}
        onPress={handleScanPress}
      >
        <Feather name="camera" size={24} color="#fff" />
        <Text style={styles.fullWidthButtonText}>Сканировать чек</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Категория *</Text>
        
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#666" />
          <TextInput
            placeholder="Поиск категории..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={filteredCategories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item}
          numColumns={2}
          columnWrapperStyle={styles.categoryRow}
          scrollEnabled={false}
        />
      </View>

      {form.image && (
        <View style={styles.imagePreview}>
          <Image 
            source={{ uri: form.image }} 
            style={styles.image} 
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={styles.removeImageButton}
            onPress={() => setForm(prev => ({ ...prev, image: null }))}
          >
            <AntDesign name="close" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>
          {isEditMode ? 'Сохранить изменения' : 'Добавить лекарство'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#2c3e50',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#34495e',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  categoryRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryButton: {
    flex: 1,
    margin: 5,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCategory: {
    backgroundColor: '#367C8B',
    shadowColor: '#367C8B',
    shadowOpacity: 0.3,
  },
  categoryText: {
    color: '#2d3436',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 10,
    gap: 10,
  },
  optionButton: {
    width: '48%',
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    backgroundColor: '#fff',
  },
  optionText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  fullWidthButton: {
    width: '100%',
    backgroundColor: '#39798F',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
    elevation: 3,
  },
  fullWidthButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  imagePreview: {
    position: 'relative',
    marginVertical: 15,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: 200,
    opacity: 0.9,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    padding: 5,
  },
  saveButton: {
    backgroundColor: '#39798F',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ManualAddScreen;