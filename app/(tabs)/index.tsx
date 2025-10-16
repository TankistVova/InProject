import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl, 
  TextInput, 
  Alert, 
  StatusBar, 
  FlatList, 
  Dimensions 
} from 'react-native';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO, isBefore, startOfToday } from 'date-fns';
import { ru } from 'date-fns/locale';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 10;
const CARD_WIDTH = (width - CARD_MARGIN * 3) / 2;

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Appointment {
  date: string;
  time: string;
  doctor: string;
  specialty: string;
}

const specialties = [
  'Терапевт', 'Педиатр', 'Стоматолог', 'Хирург', 'Кардиолог', 
  'Офтальмолог', 'Невролог', 'Гинеколог', 'Уролог', 'Эндокринолог',
  'Ревматолог', 'Психотерапевт', 'Диетолог', 'Физиотерапевт', 
  'Онколог', 'ЛОР (отоларинголог)', 'Аллерголог', 'Пульмонолог',
  'Гастроэнтеролог', 'Травматолог'
];

export default function App() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/50');
  const [medicines, setMedicines] = useState<any[]>([]);

  const router = useRouter();

  // Категории без count, количество будет вычисляться динамически
const categories: Category[] = [
  { id: 0, name: 'Все', icon: 'list' },
  { id: 1, name: 'От простуды', icon: 'temperature-low' },
  { id: 2, name: 'От боли', icon: 'pills' },
  { id: 3, name: 'От аллергии', icon: 'leaf' },
  { id: 4, name: 'Для желудка', icon: 'stethoscope' },
  { id: 5, name: 'Для сердца', icon: 'heartbeat' },
  { id: 6, name: 'Для иммунитета', icon: 'shield-alt' },
  { id: 7, name: 'Антистресс', icon: 'smile' },
  { id: 8, name: 'Витамины', icon: 'apple-alt' },
  { id: 9, name: 'Противовирусные', icon: 'virus' },
];

  const appointmentColors = [
    '#B2EBF2', '#FFCC80', '#CE93D8', '#A5D6A7', '#80DEEA', '#F48FB1',
  ];

  useEffect(() => {
    loadAppointments();
    loadProfileData();
    loadMedicines();
  }, []);

  // Загрузка записей
  const loadAppointments = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const storedAppointments = await AsyncStorage.getItem('appointments');
      const parsedAppointments: Appointment[] = storedAppointments ? JSON.parse(storedAppointments) : [];
      const sorted = parsedAppointments.sort((a, b) => 
        parseISO(a.date).getTime() - parseISO(b.date).getTime()
      );
      setAppointments(sorted);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить записи');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Загрузка профиля
  const loadProfileData = async () => {
    try {
      const [first, last, image] = await Promise.all([
        AsyncStorage.getItem('firstName'),
        AsyncStorage.getItem('lastName'),
        AsyncStorage.getItem('profileImage'),
      ]);
      if (first) setFirstName(first);
      if (last) setLastName(last);
      if (image) setProfileImage(image);
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    }
  };

  // Загрузка лекарств для подсчёта количества в категориях
  const loadMedicines = async () => {
    try {
      const storedMedicines = await AsyncStorage.getItem('medicines');
      if (storedMedicines) {
        setMedicines(JSON.parse(storedMedicines));
      } else {
        setMedicines([]);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить лекарства');
    }
  };

  // Подсчёт количества лекарств в категории
  const getCategoryCount = (categoryName: string) => {
    if (categoryName === 'Все') return medicines.length;
    return medicines.filter(med => med.category === categoryName).length;
  };

  // Удаление записи
  const handleDeleteAppointment = async (index: number) => {
    Alert.alert(
      'Удалить запись',
      'Вы уверены?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            const updated = appointments.filter((_, i) => i !== index);
            setAppointments(updated);
            await AsyncStorage.setItem('appointments', JSON.stringify(updated));
          }
        }
      ]
    );
  };

  // Случайный цвет для карточки записи
  const getCardColor = (specialty: string) => {
    const index = specialties.indexOf(specialty) % appointmentColors.length;
    return appointmentColors[index] || appointmentColors[0];
  };

  // Проверка, прошла ли запись
  const isPastAppointment = (date: string, time: string) => {
    const appointmentDateTime = parseISO(`${date}T${time}`);
    return isBefore(appointmentDateTime, new Date());
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff"/>
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadAppointments}
            tintColor="#39798F"
          />
        }
      >
        {/* Записи */}
        <Text style={styles.sectionTitle}>Мои записи</Text>
        {loading ? (
          <Text style={styles.loadingText}>Загрузка...</Text>
        ) : appointments.length > 0 ? (
          <FlatList
            horizontal
            data={appointments}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.appointmentsContainer}
            renderItem={({ item, index }) => {
              const dt = parseISO(item.date);
              const day = format(dt, 'dd');
              const month = format(dt, 'MMM', { locale: ru }).toUpperCase();
              const weekday = format(dt, 'EEE', { locale: ru }).toUpperCase();
              const color = getCardColor(item.specialty);
              const isPast = isPastAppointment(item.date, item.time);

              return (
                <View style={[styles.appointmentCard, { backgroundColor: color, opacity: isPast ? 0.7 : 1, width: width * 0.8 }]}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateDay}>{day}</Text>
                    <Text style={styles.dateMonth}>{month}</Text>
                    <Text style={styles.dateWeekday}>{weekday}</Text>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={16} color="#333" style={styles.icon} />
                      <Text style={styles.appointmentTime}>{item.time}</Text>
                    </View>
                    <View style={styles.doctorRow}>
                      <Ionicons name="person-outline" size={16} color="#333" style={styles.icon} />
                      <Text 
                        style={styles.doctorName}
                        numberOfLines={1}
                        ellipsizeMode='tail'
                      >
                        {item.doctor}
                      </Text>
                    </View>
                    <View style={styles.specialtyRow}>
                      <Ionicons name="medkit-outline" size={16} color="#333" style={styles.icon} />
                      <Text 
                        style={styles.specialty}
                        numberOfLines={1}
                        ellipsizeMode='tail'
                      >
                        {item.specialty}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.optionsButton}
                    onPress={() => handleDeleteAppointment(index)}
                  >
                    <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
                  </TouchableOpacity>
                  {isPast && (
                    <View style={styles.pastBadge}>
                      <Text style={styles.pastText}>Прошла</Text>
                    </View>
                  )}
                </View>
              );
            }}
            keyExtractor={(_, index) => index.toString()}
          />
        ) : (
          <Text style={styles.emptyText}>Нет предстоящих записей</Text>
        )}

        {/* Категории */}
        <Text style={styles.sectionTitle}>Категории</Text>
        <FlatList
          data={categories}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.categoriesContainer}
          columnWrapperStyle={styles.categoryRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => router.push({
                pathname: '/CategoryScreen',
                params: { categoryId: item.id.toString(), categoryName: item.name }
              })}
            >
              <FontAwesome5 name={item.icon} size={28} color="#39798F" />
              <Text style={styles.categoryTitle}>{item.name}</Text>
              <Text style={styles.categoryCount}>{getCategoryCount(item.name)} препаратов</Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id.toString()}
        />
      </ScrollView>

      {/* Плавающая кнопка */}
      <Link href="/DoctorsAppointment" asChild>
        <TouchableOpacity style={styles.fab}>
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#fff',
      paddingTop: StatusBar.currentHeight || 0 
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 30,
    marginHorizontal: 20,
    paddingHorizontal: 20,
    marginVertical: 10,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  qrButton: {
    marginLeft: 10,
    padding: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginVertical: 15,
    color: '#333',
  },
  dateBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    width: 60,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  dateMonth: {
    fontSize: 12,
    color: '#fff',
    textTransform: 'uppercase',
  },
  dateWeekday: {
    fontSize: 12,
    color: '#fff',
    textTransform: 'uppercase',
  },
  appointmentInfo: {
    flex: 1,
    paddingRight: 30, // Добавлен отступ справа для предотвращения перекрытия
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  doctorName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  specialty: {
    fontSize: 12,
    color: '#666',
  },
  optionsButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
  },
  pastBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pastText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    paddingHorizontal: CARD_MARGIN,
  },
  categoryRow: {
    justifyContent: 'space-between',
    marginBottom: CARD_MARGIN,
  },
  categoryCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#39798F33',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#39798F',
    textAlign: 'center',
    marginTop: 10,
  },
  categoryCount: {
    fontSize: 12,
    color: '#39798F',
    textAlign: 'center',
    marginTop: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#39798F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
  },
  appointmentsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginRight: 15,
    padding: 15,
    height: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
});