import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import * as Notifications from 'expo-notifications';

interface MedicineReminder {
  id: string;
  medicineName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notificationId?: string;
}

const MedicineReminderScreen = () => {
  const [medicineName, setMedicineName] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);

  useEffect(() => {
    loadReminders();
    registerForPushNotificationsAsync();
  }, []);

  async function registerForPushNotificationsAsync() {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert('Ошибка', 'Необходимо разрешение на уведомления');
      }
    }
  }

  const loadReminders = async () => {
    try {
      const stored = await AsyncStorage.getItem('medicineReminders');
      if (stored) {
        setReminders(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Ошибка загрузки напоминаний:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить напоминания');
    }
  };

  const saveReminders = async (newReminders: MedicineReminder[]) => {
    try {
      await AsyncStorage.setItem('medicineReminders', JSON.stringify(newReminders));
      setReminders(newReminders);
    } catch (error) {
      console.error('Ошибка сохранения напоминания:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить напоминание');
    }
  };

  const pad = (num: number) => num.toString().padStart(2, '0');

  const scheduleNotification = async (reminder: MedicineReminder) => {
    const [year, month, day] = reminder.date.split('-').map(Number);
    const [hour, minute] = reminder.time.split(':').map(Number);
  
    const trigger: Notifications.CalendarTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR, 
      year,
      month,
      day,
      hour,
      minute,
      second: 0, 
    };
  
    const now = new Date();
    const scheduledTime = new Date(year, month - 1, day, hour, minute);
  
    if (scheduledTime <= now) {
      Alert.alert('Ошибка', 'Выберите дату и время в будущем');
      return null;
    }
  
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Напоминание о приеме лекарства',
          body: `Пора принять: ${reminder.medicineName}`,
          sound: true,
        },
        trigger, 
      });
      return notificationId;
    } catch (error) {
      console.error('Ошибка планирования уведомления:', error);
      Alert.alert('Ошибка', 'Не удалось запланировать уведомление');
      return null;
    }
  };

  const addReminder = async () => {
    if (!medicineName.trim()) {
      Alert.alert('Ошибка', 'Введите название лекарства');
      return;
    }

    const isoDate = date.toISOString().split('T')[0];
    const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}`;

    const newReminder: MedicineReminder = {
      id: Date.now().toString(),
      medicineName: medicineName.trim(),
      date: isoDate,
      time: timeStr,
    };

    const notificationId = await scheduleNotification(newReminder);
    if (notificationId) {
      newReminder.notificationId = notificationId;
      const updated = [...reminders, newReminder];
      await saveReminders(updated);

      Alert.alert('Успех', 'Напоминание добавлено');

      setMedicineName('');
      setDate(new Date());
      setTime(new Date());
    }
  };

  const deleteReminder = async (id: string, notificationId?: string) => {
    if (notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      } catch {}
    }
    const filtered = reminders.filter(r => r.id !== id);
    await saveReminders(filtered);
  };

  const onDateChange = (itemValue: number, field: 'year' | 'month' | 'day') => {
    let newDate = new Date(date);
    if (field === 'year') newDate.setFullYear(itemValue);
    if (field === 'month') newDate.setMonth(itemValue - 1); 
    if (field === 'day') newDate.setDate(itemValue);
    setDate(newDate);
  };

  const onTimeChange = (itemValue: number, field: 'hour' | 'minute') => {
    let newTime = new Date(time);
    if (field === 'hour') newTime.setHours(itemValue);
    if (field === 'minute') newTime.setMinutes(itemValue);
    setTime(newTime);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Название лекарства:</Text>
      <TextInput
        style={styles.input}
        value={medicineName}
        onChangeText={setMedicineName}
        placeholder="Введите название"
      />

      <Text style={styles.label}>Дата приема:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={date.getFullYear()}
          onValueChange={(itemValue) => onDateChange(itemValue, 'year')}>
          {[...Array(10).keys()].map(i => (
            <Picker.Item key={i} label={`${2025 + i}`} value={2025 + i} />
          ))}
        </Picker>

        <Picker
          selectedValue={date.getMonth() + 1}
          onValueChange={(itemValue) => onDateChange(itemValue, 'month')}>
          {[...Array(12).keys()].map(i => (
            <Picker.Item key={i} label={`${i + 1}`} value={i + 1} />
          ))}
        </Picker>

        <Picker
          selectedValue={date.getDate()}
          onValueChange={(itemValue) => onDateChange(itemValue, 'day')}>
          {[...Array(31).keys()].map(i => (
            <Picker.Item key={i} label={`${i + 1}`} value={i + 1} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Время приема:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={time.getHours()}
          onValueChange={(itemValue) => onTimeChange(itemValue, 'hour')}>
          {[...Array(24).keys()].map(i => (
            <Picker.Item key={i} label={`${i}`} value={i} />
          ))}
        </Picker>

        <Picker
          selectedValue={time.getMinutes()}
          onValueChange={(itemValue) => onTimeChange(itemValue, 'minute')}>
          {[...Array(60).keys()].map(i => (
            <Picker.Item key={i} label={`${i}`} value={i} />
          ))}
        </Picker>
      </View>

      <View style={{ marginTop: 20 }}>
        <Button title="Добавить прием" onPress={addReminder} />
      </View>

      <ScrollView style={{ marginTop: 30, maxHeight: 300 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Напоминания:</Text>
        {reminders.length === 0 && <Text>Пока нет напоминаний</Text>}
        {reminders.map(r => (
          <View key={r.id} style={styles.reminderItem}>
            <Text style={styles.reminderText}>
              {r.medicineName} - {r.date} в {r.time}
            </Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Удалить напоминание',
                  'Вы уверены, что хотите удалить это напоминание?',
                  [
                    { text: 'Отмена', style: 'cancel' },
                    {
                      text: 'Удалить',
                      style: 'destructive',
                      onPress: () => deleteReminder(r.id, r.notificationId),
                    },
                  ]
                )
              }
            >
              <Text style={styles.deleteText}>Удалить</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default MedicineReminderScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, marginVertical: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    fontSize: 16,
  },
  reminderItem: {
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fafafa',
  },
  reminderText: {
    fontSize: 16,
    marginBottom: 6,
  },
  deleteText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 14,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
