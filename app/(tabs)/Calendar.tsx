import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Notifications from 'expo-notifications';

interface Reminder {
  id: string;
  medicineName: string;
  dosage: string;
  time: string;
  days?: number[];
  date?: string;
  notificationIds?: string[];
}

const TIME_SLOTS = ['08:00', '10:00', '12:00', '15:00', '18:00', '21:00'];
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
      const stored = await AsyncStorage.getItem('medicineReminders');
      if (!stored) return;

      const existing: Reminder[] = JSON.parse(stored);
      const toDelete = existing.find(r => r.id === id);

      if (toDelete?.notificationIds?.length) {
        for (const notifId of toDelete.notificationIds) {
          await Notifications.cancelScheduledNotificationAsync(notifId);
        }
      }

      const updated = existing.filter(r => r.id !== id);
      await AsyncStorage.setItem('medicineReminders', JSON.stringify(updated));
      setReminders(updated);
    } catch (err) {
      console.error('Ошибка при удалении:', err);
    }
  };

  const getRemindersForSlot = (time: string) => {
    const currentDate = new Date(selectedDate);
    const weekday = currentDate.getDay() === 0 ? 7 : currentDate.getDay();

    return reminders.filter(r => {
      const timeMatch = r.time.startsWith(time);
      const isRepeat = r.days?.includes(weekday);
      const isExact = r.date && isSameDay(new Date(r.date), currentDate);
      return timeMatch && (isRepeat || isExact);
    });
  };

  const renderDateSelector = () => {
    const daysInMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(selectedYear, selectedMonthIndex, i + 1);
      return {
        date,
        iso: format(date, 'yyyy-MM-dd'),
        day: format(date, 'dd'),
        weekday: format(date, 'EEE', { locale: ru })
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
          {days.map(({ iso, day, weekday }) => {
            const isSelected = iso === selectedDate;
            return (
              <TouchableOpacity
                key={iso}
                onPress={() => setSelectedDate(iso)}
                style={[styles.dayBox, isSelected && styles.dayBoxActive]}
              >
                <Text style={[styles.dayNumber, isSelected && styles.dayTextActive]}>{day}</Text>
                <Text style={[styles.dayLabel, isSelected && styles.dayTextActive]}>{weekday}</Text>
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
        {TIME_SLOTS.map(slot => {
          const items = getRemindersForSlot(slot);
          return (
            <View key={slot} style={styles.timeRow}>
              <View style={styles.timeLabelBox}>
                <Text style={styles.timeLabel}>{slot}</Text>
              </View>
              <View style={styles.reminderBox}>
                {items.length > 0 ? (
                  items.map(item => (
                    <View key={item.id} style={styles.medicineCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medicineName}>{item.medicineName}</Text>
                        <Text style={styles.dosage}>{item.dosage}</Text>
                      </View>
                      <TouchableOpacity onPress={() => confirmDeleteReminder(item.id)}>
                        <Text style={styles.deleteText}>Удалить</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>—</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
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
  emptyCard: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    color: '#ccc'
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
