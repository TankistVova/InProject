import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { format } from 'date-fns';

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

const AddReminder: React.FC = () => {
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const getNextWeekdayTimeInSeconds = (targetWeekday: number, targetTime: Date): number => {
    const now = new Date();
    const todayWeekday = now.getDay() === 0 ? 7 : now.getDay();
    const diff = (targetWeekday - todayWeekday + 7) % 7;
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + diff);
    nextDate.setHours(targetTime.getHours(), targetTime.getMinutes(), 0, 0);
    return Math.max(5, Math.floor((nextDate.getTime() - now.getTime()) / 1000));
  };

  const handleSave = async () => {
    if (!medicineName || !dosage || selectedDays.length === 0) {
      Alert.alert('Ошибка', 'Заполните все поля и выберите дни');
      return;
    }

    const id = Date.now().toString();
    const formattedTime = format(time, 'HH:mm');
    const notificationIds: string[] = [];

    try {
      for (const day of selectedDays) {
        const seconds = getNextWeekdayTimeInSeconds(day, time);
        const notifId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Напоминание о приёме',
            body: `${medicineName} — ${dosage}`,
            sound: true,
          },
          trigger: {
            type: 'timeInterval',
            seconds,
            repeats: false,
          } as Notifications.NotificationTriggerInput
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
      existing.push(newReminder);
      await AsyncStorage.setItem('medicineReminders', JSON.stringify(existing));

      Alert.alert('Успех', 'Напоминание сохранено');
      router.replace('/(tabs)/Calendar');
    } catch (err) {
      console.error('Ошибка уведомления:', err);
      Alert.alert('Ошибка', 'Не удалось создать уведомление');
    }
  };

  const handleClearAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    Alert.alert('Готово', 'Все уведомления удалены');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Название лекарства</Text>
      <TextInput
        style={styles.input}
        value={medicineName}
        onChangeText={setMedicineName}
        placeholder="Анальгин"
      />

      <Text style={styles.label}>Дозировка</Text>
      <TextInput
        style={styles.input}
        value={dosage}
        onChangeText={setDosage}
        placeholder="1 таблетка"
      />

      <Text style={styles.label}>Время приёма</Text>
      <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
        <Text>{format(time, 'HH:mm')}</Text>
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

      <Text style={styles.label}>Дни приёма</Text>
      <View style={styles.daysRow}>
        {daysOfWeek.map(({ id, label }) => (
          <TouchableOpacity
            key={id}
            style={[styles.dayButton, selectedDays.includes(id) && styles.dayButtonSelected]}
            onPress={() => toggleDay(id)}
          >
            <Text style={[styles.dayText, selectedDays.includes(id) && styles.dayTextSelected]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Сохранить</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: 'red', marginTop: 10 }]}
        onPress={handleClearAllNotifications}
      >
        <Text style={styles.saveText}>Очистить уведомления</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AddReminder;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 14, color: '#555', marginTop: 20, marginBottom: 5 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 12, fontSize: 16
  },
  timeButton: {
    backgroundColor: '#eee', padding: 12, borderRadius: 8, alignItems: 'center'
  },
  daysRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 10
  },
  dayButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center'
  },
  dayButtonSelected: { backgroundColor: '#39798F' },
  dayText: { color: '#444', fontWeight: '500' },
  dayTextSelected: { color: '#fff' },
  saveButton: {
    backgroundColor: '#39798F', marginTop: 30,
    padding: 16, borderRadius: 10, alignItems: 'center'
  },
  saveText: {
    color: '#fff', fontSize: 16, fontWeight: '600'
  }
});
