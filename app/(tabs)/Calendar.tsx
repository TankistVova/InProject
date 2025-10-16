import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, isSameDay, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { MaterialIcons } from '@expo/vector-icons';

interface Reminder {
  id: string;
  medicineName: string;
  dosage: string;
  time: string;
  days?: number[];
  date?: string;
  notificationIds?: string[];
}

interface NotificationLog {
  id: string;
  title: string;
  subtitle: string;
  timestamp: Date;
  type: 'таблетка' | 'укол' | 'капли';
  isRead: boolean;
  reminderId?: string;
}

const months = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export default function CalendarScreen() {
  const now = new Date();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(now.getMonth());
  const [selectedYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState(format(now, 'yyyy-MM-dd'));
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const loadReminders = async () => {
        const stored = await AsyncStorage.getItem('medicineReminders');
        if (stored) setReminders(JSON.parse(stored));
      };
      loadReminders();
    }, [])
  );

  const confirmDeleteReminder = (id: string) => {
    Alert.alert('Удаление', 'Удалить это напоминание?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => handleDeleteReminder(id)
      }
    ]);
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      // Delete from reminders
      const storedReminders = await AsyncStorage.getItem('medicineReminders');
      if (!storedReminders) return;

      const existingReminders: Reminder[] = JSON.parse(storedReminders);
      const toDelete = existingReminders.find(r => r.id === id);

      if (toDelete?.notificationIds?.length) {
        for (const notifId of toDelete.notificationIds) {
          await Notifications.cancelScheduledNotificationAsync(notifId);
        }
      }

      const updatedReminders = existingReminders.filter(r => r.id !== id);
      await AsyncStorage.setItem('medicineReminders', JSON.stringify(updatedReminders));
      setReminders(updatedReminders);

      // Also delete related logs from notificationLogs
      const storedLogs = await AsyncStorage.getItem('notificationLogs');
      if (storedLogs) {
        const existingLogs: NotificationLog[] = JSON.parse(storedLogs);
        const updatedLogs = existingLogs.filter(l => l.reminderId !== id);
        await AsyncStorage.setItem('notificationLogs', JSON.stringify(updatedLogs));
      }

      Alert.alert('Успех', 'Напоминание удалено');
    } catch (err) {
      console.error('Ошибка при удалении:', err);
      Alert.alert('Ошибка', 'Не удалось удалить напоминание');
    }
  };

  const hasRemindersOnDate = (date: Date) => {
    const weekday = getDay(date) === 0 ? 7 : getDay(date);
    return reminders.some(r => 
      r.days?.includes(weekday) || (r.date && isSameDay(new Date(r.date), date))
    );
  };

  const getRemindersForDay = () => {
    const currentDate = new Date(selectedDate);
    const weekday = getDay(currentDate) === 0 ? 7 : getDay(currentDate);

    const items = reminders.filter(r => {
      const isRepeat = r.days?.includes(weekday);
      const isExact = r.date && isSameDay(new Date(r.date), currentDate);
      return isRepeat || isExact;
    });

    // Sort by time
    items.sort((a, b) => a.time.localeCompare(b.time));

    return items;
  };

  const renderDateSelector = () => {
    const daysInMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(selectedYear, selectedMonthIndex, i + 1);
      return {
        date,
        iso: format(date, 'yyyy-MM-dd'),
        day: format(date, 'dd'),
        weekday: format(date, 'EEE', { locale: ru }),
        hasReminders: hasRemindersOnDate(date)
      };
    });

    return (
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
          {months.map((month, index) => (
            <TouchableOpacity key={month} onPress={() => setSelectedMonthIndex(index)}>
              <Text style={[styles.monthText, index === selectedMonthIndex && styles.activeMonth]}>
                {month}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
          {days.map(({ iso, day, weekday, hasReminders }) => {
            const isSelected = iso === selectedDate;
            return (
              <TouchableOpacity
                key={iso}
                onPress={() => setSelectedDate(iso)}
                style={[styles.dayBox, isSelected && styles.dayBoxActive]}
              >
                <Text style={[styles.dayNumber, isSelected && styles.dayTextActive]}>{day}</Text>
                <Text style={[styles.dayLabel, isSelected && styles.dayTextActive]}>{weekday}</Text>
                {hasReminders && (
                  <View style={[styles.reminderDot, isSelected && styles.reminderDotActive]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {format(new Date(selectedDate), 'd MMMM yyyy', { locale: ru })}
      </Text>

      {renderDateSelector()}

      <ScrollView style={{ flex: 1 }}>
        {getRemindersForDay().length > 0 ? (
          getRemindersForDay().map(item => (
            <View key={item.id} style={styles.timeRow}>
              <View style={styles.timeLabelBox}>
                <Text style={styles.timeLabel}>{item.time}</Text>
              </View>
              <View style={styles.reminderBox}>
                <View style={styles.medicineCard}>
                  <MaterialIcons 
                    name="medication" 
                    size={24} 
                    color="#39798F" 
                    style={styles.medicineIcon}
                  />
                  <View style={styles.medicineInfo}>
                    <Text style={styles.medicineName}>{item.medicineName}</Text>
                    <Text style={styles.dosage}>{item.dosage}</Text>
                  </View>
                  <TouchableOpacity onPress={() => confirmDeleteReminder(item.id)}>
                    <Text style={styles.deleteText}>Удалить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Нет напоминаний на этот день</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/AddReminder')}>
        <Text style={styles.addButtonText}>＋ Добавить напоминание</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 10
  },
  monthScroll: {
    paddingHorizontal: 20,
    marginBottom: 10
  },
  monthText: {
    fontSize: 16,
    color: '#999',
    marginRight: 15
  },
  activeMonth: {
    color: '#00BBD4',
    fontWeight: 'bold'
  },
  dayScroll: {
    paddingHorizontal: 20,
    paddingBottom: 10
  },
  dayBox: {
    width: 50,
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#eee'
  },
  dayBoxActive: {
    backgroundColor: '#00BBD4'
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  dayLabel: {
    fontSize: 12,
    color: '#777'
  },
  dayTextActive: {
    color: '#fff'
  },
  reminderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#39798F',
    marginTop: 4
  },
  reminderDotActive: {
    backgroundColor: '#fff'
  },
  timeRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: 'center'
  },
  timeLabelBox: {
    width: 60
  },
  timeLabel: {
    fontSize: 14,
    color: '#999'
  },
  reminderBox: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 10,
    padding: 10
  },
  medicineCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  medicineIcon: {
    marginRight: 5,
  },
  medicineInfo: {
    flex: 1,
    marginLeft: 10,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333'
  },
  dosage: {
    fontSize: 12,
    color: '#666'
  },
  deleteText: {
    color: 'red',
    fontWeight: 'bold'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50
  },
  emptyText: {
    color: '#ccc',
    fontSize: 16
  },
  addButton: {
    backgroundColor: '#39798F',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    margin: 20
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});