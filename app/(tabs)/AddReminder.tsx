import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { router } from 'expo-router';

interface Reminder {
  id: string;
  medicineName: string;
  dosage: string;
  time: string;
  days: number[];
  notificationIds: string[];
}

const daysOfWeek = [
  { id: 1, label: 'Пн' },
  { id: 2, label: 'Вт' },
  { id: 3, label: 'Ср' },
  { id: 4, label: 'Чт' },
  { id: 5, label: 'Пт' },
  { id: 6, label: 'Сб' },
  { id: 7, label: 'Вс' },
];

export default function AddReminder() {
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  useEffect(() => {
    // Настройка обработчика уведомлений (для показа в foreground)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true, // 🔹 Замена deprecated shouldShowAlert: показ баннера
        shouldShowList: true,   // 🔹 Добавлено: добавление в центр уведомлений
        shouldPlaySound: true,  // Включили звук
        shouldSetBadge: false,
      }),
    });

    // Запрос разрешений
    Notifications.requestPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Разрешение на уведомления не предоставлено');
      }
    });

    // Создание канала для Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }, []);

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSave = async () => {
    if (!medicineName.trim()) {
      Alert.alert('Ошибка', 'Введите название лекарства');
      return;
    }
    if (!dosage.trim()) {
      Alert.alert('Ошибка', 'Укажите дозировку');
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert('Ошибка', 'Выберите хотя бы один день приёма');
      return;
    }

    const id = Date.now().toString();
    const formattedTime = format(time, 'HH:mm');
    const notificationIds: string[] = [];

    try {
      for (const day of selectedDays) {
        const expoWeekday = day === 7 ? 1 : day + 1; // Expo: Sunday=1, Monday=2, ...

        const trigger = {
          weekday: expoWeekday,
          hour: time.getHours(),
          minute: time.getMinutes(),
          repeats: true,
          channelId: Platform.OS === 'android' ? 'default' : undefined, // 🔹 Перемещено внутрь trigger!
        } as any;

        const notifId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Напоминание о приёме',
            body: `${medicineName} — ${dosage}`,
            sound: true,
            data: { reminderId: id },
          },
          trigger,
        });

        notificationIds.push(notifId);
      }

      const newReminder: Reminder = {
        id,
        medicineName,
        dosage,
        time: formattedTime,
        days: selectedDays,
        notificationIds,
      };

      const stored = await AsyncStorage.getItem('medicineReminders');
      const existing: Reminder[] = stored ? JSON.parse(stored) : [];
      const updated = [...existing, newReminder];
      await AsyncStorage.setItem('medicineReminders', JSON.stringify(updated));

      Alert.alert('Успех', 'Напоминание сохранено');
      router.replace('/(tabs)/Calendar');
    } catch (err) {
      console.error('Ошибка создания уведомления:', err);
      Alert.alert('Ошибка', 'Не удалось создать уведомление');
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert('Готово', 'Все уведомления удалены');
    } catch (err) {
      console.error('Ошибка удаления уведомлений:', err);
      Alert.alert('Ошибка', 'Не удалось удалить уведомления');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Добавить напоминание</Text>

      <Text style={styles.label}>Название лекарства</Text>
      <TextInput
        style={styles.input}
        value={medicineName}
        onChangeText={setMedicineName}
        placeholder="Например: Парацетамол"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Дозировка</Text>
      <TextInput
        style={styles.input}
        value={dosage}
        onChangeText={setDosage}
        placeholder="Например: 500 мг"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Время</Text>
      <TouchableOpacity
        style={styles.timeButton}
        onPress={() => setShowTimePicker(true)}
      >
        <Text style={styles.timeText}>{format(time, 'HH:mm')}</Text>
      </TouchableOpacity>

      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={(_, selected) => {
            setShowTimePicker(false);
            if (selected) setTime(selected);
          }}
        />
      )}

      <Text style={styles.label}>Дни недели</Text>
      <View style={styles.daysRow}>
        {daysOfWeek.map(({ id, label }) => (
          <TouchableOpacity
            key={id}
            style={[
              styles.dayButton,
              selectedDays.includes(id) && styles.dayButtonSelected
            ]}
            onPress={() => toggleDay(id)}
          >
            <Text
              style={[
                styles.dayText,
                selectedDays.includes(id) && styles.dayTextSelected
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={!medicineName || !dosage || selectedDays.length === 0}
      >
        <Text style={styles.saveText}>Сохранить</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.saveButton, styles.clearButton]}
        onPress={handleClearAllNotifications}
      >
        <Text style={styles.saveText}>Очистить все уведомления</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  heading: { fontSize: 20, fontWeight: '600', marginBottom: 20 },
  label: { marginTop: 10, fontSize: 16, color: '#333' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 10, marginTop: 5, fontSize: 16, backgroundColor: '#f9f9f9'
  },
  timeButton: {
    marginTop: 5, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center'
  },
  timeText: { fontSize: 16 },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 15 },
  dayButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0',
    justifyContent: 'center', alignItems: 'center', margin: 5
  },
  dayButtonSelected: { backgroundColor: '#39798F' },
  dayText: { fontSize: 14, color: '#555' },
  dayTextSelected: { color: '#fff' },
  saveButton: {
    marginTop: 20, padding: 14, borderRadius: 8,
    backgroundColor: '#39798F', alignItems: 'center'
  },
  clearButton: { backgroundColor: '#e74c3c', marginTop: 10 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});