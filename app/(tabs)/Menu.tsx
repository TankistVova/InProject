import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';

// Локальные изображения
const bannerList = [
  {
    title: 'Аптека "Здоровье+"',
    subtitle: 'Скидки в аптеках Таганрога',
    image: require('../styles/images/Reklama1.png')
  },
  {
    title: 'Аптека "Будь здоров"',
    subtitle: 'Акции каждую неделю',
    image: require('../styles/images/Reklama2.png')
  },
  {
    title: 'Аптека "Фарма+"',
    subtitle: 'Доставка по городу',
    image: require('../styles/images/Reklama3.png')
  }
];

export default function MenuScreen() {
  const router = useRouter();
  const [banner, setBanner] = useState(bannerList[0]);

  // 🔁 Обновляем баннер при каждом заходе на экран
  useFocusEffect(
    useCallback(() => {
      const random = bannerList[Math.floor(Math.random() * bannerList.length)];
      setBanner(random);
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* 📢 Баннер */}
      <View style={styles.banner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>{banner.title}</Text>
          <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
        </View>
        <Image source={banner.image} style={styles.bannerImage} />
      </View>

      {/* 🔔 Уведомления */}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => router.push('/Notifications')}
      >
        <Feather name="bell" size={20} color="#333" />
        <Text style={styles.menuText}>Уведомления</Text>
        <Feather name="chevron-right" size={20} color="#ccc" />
      </TouchableOpacity>

            {/* 🔔 Уведомления */}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => router.push('/Maps')}
      >
        <Feather name="map" size={20} color="#333" />
        <Text style={styles.menuText}>Аптеки рядом</Text>
        <Feather name="chevron-right" size={20} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => router.push('/Authors')}
      >
        <Feather name="users" size={20} color="#333" />
        <Text style={styles.menuText}>Авторы проекта</Text>
        <Feather name="chevron-right" size={20} color="#ccc" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60
  },
  banner: {
    backgroundColor: '#39798F33',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0077B6'
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#444',
    marginTop: 4
  },
  bannerFooter: {
    fontSize: 11,
    color: '#39798F',
    marginTop: 8,
    fontStyle: 'italic'
  },
  bannerImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginLeft: 10
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  menuText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333'
  }
});
