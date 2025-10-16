import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useFocusEffect } from 'expo-router';
import * as Notifications from 'expo-notifications';

interface NotificationLog {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string; // сохраняем как строку для удобства
  type: 'таблетка' | 'укол' | 'капли';
  isRead: boolean;
  reminderId?: string;
}

interface SectionData {
  title: string;
  data: NotificationLog[];
}

export default function NotificationsScreen() {
  const [sections, setSections] = useState<SectionData[]>([]);

  useEffect(() => {
    // 🔹 Слушатель для foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener(handleNotificationLog);

    // 🔹 Слушатель для тапа на уведомление (background/closed)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const notification = response.notification;
      handleNotificationLog(notification);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  // 🔹 Функция для логирования (общая для обоих слушателей)
  const handleNotificationLog = async (notification: Notifications.Notification) => {
    const content = notification.request.content;
    const data = content.data;
    const log: NotificationLog = {
      id: Date.now().toString(),
      title: content.title || '',
      subtitle: content.body || '',
      timestamp: new Date().toISOString(),
      type: 'таблетка', // default type
      isRead: false,
      reminderId: data?.reminderId as string | undefined,
    };

    const storedLogs = await AsyncStorage.getItem('notificationLogs');
    const existing: NotificationLog[] = storedLogs ? JSON.parse(storedLogs) : [];
    const updated = [...existing, log];
    await AsyncStorage.setItem('notificationLogs', JSON.stringify(updated));
    loadNotifications();
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    const stored = await AsyncStorage.getItem('notificationLogs');
    if (!stored) {
      setSections([]);
      return;
    }

    const logs: NotificationLog[] = JSON.parse(stored);

    const now = new Date();
    const validLogs = logs.filter(log => new Date(log.timestamp) <= now);

    validLogs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const today: NotificationLog[] = [];
    const yesterday: NotificationLog[] = [];
    const older: NotificationLog[] = [];

    for (const item of validLogs) {
      const ts = new Date(item.timestamp);
      if (isToday(ts)) today.push(item);
      else if (isYesterday(ts)) yesterday.push(item);
      else older.push(item);
    }

    const result: SectionData[] = [];
    if (today.length) result.push({ title: 'Сегодня', data: today });
    if (yesterday.length) result.push({ title: 'Вчера', data: yesterday });
    if (older.length) result.push({ title: 'Ранее', data: older });

    setSections(result);
  };

  const toggleRead = async (id: string) => {
    const stored = await AsyncStorage.getItem('notificationLogs');
    if (!stored) return;
    const logs: NotificationLog[] = JSON.parse(stored);
    const updated = logs.map(l =>
      l.id === id ? { ...l, isRead: !l.isRead } : l
    );
    await AsyncStorage.setItem('notificationLogs', JSON.stringify(updated));
    loadNotifications();
  };

  const deleteNotification = (id: string) => {
    Alert.alert('Удалить', 'Удалить это уведомление?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          const stored = await AsyncStorage.getItem('notificationLogs');
          if (!stored) return;
          const logs: NotificationLog[] = JSON.parse(stored);
          const updated = logs.filter(l => l.id !== id);
          await AsyncStorage.setItem('notificationLogs', JSON.stringify(updated));
          loadNotifications();
        },
      },
    ]);
  };

  const getIcon = (type: NotificationLog['type']) => {
    switch (type) {
      case 'укол': return '💉';
      case 'капли': return '🍵';
      default: return '💊';
    }
  };

  const renderItem = ({ item }: { item: NotificationLog }) => (
    <TouchableOpacity
      onPress={() => toggleRead(item.id)}
      onLongPress={() => deleteNotification(item.id)}
      style={styles.notificationItem}
    >
      <Text style={styles.icon}>{getIcon(item.type)}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, item.isRead && styles.readText]}>{item.title}</Text>
        <Text style={[styles.subtitle, item.isRead && styles.readText]}>{item.subtitle}</Text>
      </View>
      <Text style={styles.timeAgo}>
        {formatDistanceToNow(new Date(item.timestamp), { locale: ru, addSuffix: true })}
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
        ListEmptyComponent={<Text style={styles.emptyText}>Нет уведомлений</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginHorizontal: 16, marginTop: 24, marginBottom: 8, color: '#999' },
  notificationItem: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 12, borderBottomColor: '#eee', borderBottomWidth: 1, gap: 12 },
  icon: { fontSize: 20, marginTop: 4 },
  title: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#555' },
  timeAgo: { fontSize: 12, color: '#999', alignSelf: 'flex-start', marginTop: 4 },
  readText: { color: '#bbb' },
  emptyText: { textAlign: 'center', marginTop: 100, color: '#aaa', fontSize: 16 },
});