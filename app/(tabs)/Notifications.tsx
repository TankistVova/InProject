import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isToday,
  isYesterday,
  formatDistanceToNow
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { useFocusEffect } from 'expo-router';

interface Reminder {
  id: string;
  medicineName: string;
  dosage: string;
  time: string;
  date?: string;
  days?: number[];
  type?: 'таблетка' | 'укол' | 'капли';
  isRead?: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: Date;
  type: 'таблетка' | 'укол' | 'капли';
  isRead: boolean;
}

interface SectionData {
  title: string;
  data: NotificationItem[];
}

export default function NotificationsScreen() {
  const [sections, setSections] = useState<SectionData[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    const stored = await AsyncStorage.getItem('medicineReminders');
    if (!stored) return;

    const reminders: Reminder[] = JSON.parse(stored);
    const now = new Date();

    const all: NotificationItem[] = reminders.map(r => {
      const timestamp = r.date ? new Date(`${r.date}T${r.time}`) : now;
      return {
        id: r.id,
        title: 'Принять лекарство',
        subtitle: `${r.medicineName} — ${r.dosage}`,
        timestamp,
        type: r.type || 'таблетка',
        isRead: r.isRead || false,
      };
    });

    // сортировка по дате (новые сверху)
    all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const today: NotificationItem[] = [];
    const yesterday: NotificationItem[] = [];
    const older: NotificationItem[] = [];

    for (const item of all) {
      if (isToday(item.timestamp)) today.push(item);
      else if (isYesterday(item.timestamp)) yesterday.push(item);
      else older.push(item);
    }

    const result: SectionData[] = [];
    if (today.length) result.push({ title: 'Сегодня', data: today });
    if (yesterday.length) result.push({ title: 'Вчера', data: yesterday });
    if (older.length) result.push({ title: 'Ранее', data: older });

    setSections(result);
  };

  const toggleRead = async (id: string) => {
    const stored = await AsyncStorage.getItem('medicineReminders');
    if (!stored) return;
    const reminders: Reminder[] = JSON.parse(stored);
    const updated = reminders.map(r =>
      r.id === id ? { ...r, isRead: !r.isRead } : r
    );
    await AsyncStorage.setItem('medicineReminders', JSON.stringify(updated));
    loadNotifications();
  };

  const deleteNotification = (id: string) => {
    Alert.alert('Удалить', 'Удалить это уведомление?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          const stored = await AsyncStorage.getItem('medicineReminders');
          if (!stored) return;
          const reminders: Reminder[] = JSON.parse(stored);
          const updated = reminders.filter(r => r.id !== id);
          await AsyncStorage.setItem('medicineReminders', JSON.stringify(updated));
          loadNotifications();
        }
      }
    ]);
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'укол':
        return '💉';
      case 'капли':
        return '🍵';
      default:
        return '💊';
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      onPress={() => toggleRead(item.id)}
      onLongPress={() => deleteNotification(item.id)}
      style={styles.notificationItem}
    >
      <Text style={styles.icon}>{getIcon(item.type)}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, item.isRead && styles.readText]}>
          {item.title}
        </Text>
        <Text style={[styles.subtitle, item.isRead && styles.readText]}>
          {item.subtitle}
        </Text>
      </View>
      <Text style={styles.timeAgo}>
        {formatDistanceToNow(item.timestamp, { locale: ru, addSuffix: true })}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Нет уведомлений</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    color: '#999',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    gap: 12,
  },
  icon: {
    fontSize: 20,
    marginTop: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#555',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  readText: {
    color: '#bbb',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 100,
    color: '#aaa',
    fontSize: 16,
  },
});
