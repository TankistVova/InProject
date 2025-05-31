import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Linking,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';


const colors = ['#B2EBF2', '#A5D6A7', '#FFCC80', '#CE93D8', '#FFE082', '#80DEEA'];

const authors = [
  {
    name: 'Моргун Сергей',
    role: 'Frontend-разработчик',
    desc: 'React Native, Expo, UX логика и взаимодействие.',
    image: require('../styles/images/father.png'),
    telegram: 'https://t.me/TankistVova',
    github: 'https://github.com/TankistVova',
  },
  {
    name: 'Моргун Сергей',
    role: 'Frontend-разработчик',
    desc: 'React Native, Expo, UX логика и взаимодействие.',
    image: require('../styles/images/father.png'),
    telegram: 'https://t.me/TankistVova',
    github: 'https://github.com/TankistVova',
  },
 {
    name: 'Моргун Сергей',
    role: 'Frontend-разработчик',
    desc: 'React Native, Expo, UX логика и взаимодействие.',
    image: require('../styles/images/father.png'),
    telegram: 'https://t.me/TankistVova',
    github: 'https://github.com/TankistVova',
  },
 {
    name: 'Моргун Сергей',
    role: 'Frontend-разработчик',
    desc: 'React Native, Expo, UX логика и взаимодействие.',
    image: require('../styles/images/father.png'),
    telegram: 'https://t.me/ivan_dev',
    github: 'https://github.com/TankistVova',
  },
   {
    name: 'Моргун Сергей',
    role: 'Frontend-разработчик',
    desc: 'React Native, Expo, UX логика и взаимодействие.',
    image: require('../styles/images/father.png'),
    telegram: 'https://t.me/ivan_dev',
    github: 'https://github.com/TankistVova',
  },
   {
    name: 'Моргун Сергей',
    role: 'Frontend-разработчик',
    desc: 'React Native, Expo, UX логика и взаимодействие.',
    image: require('../styles/images/father.png'),
    telegram: 'https://t.me/ivan_dev',
    github: 'https://github.com/TankistVova',
  },
];

export default function Authors() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Авторы проекта</Text>
      <View style={styles.grid}>
        {authors.map((author, index) => (
          <View key={index} style={[styles.card, { borderTopColor: colors[index % colors.length] }]}>
            <Image source={author.image} style={styles.avatar} />
            <Text style={styles.name}>{author.name}</Text>
            <Text style={styles.role}>{author.role}</Text>
            <Text style={styles.desc}>{author.desc}</Text>
            <View style={styles.icons}>
              {author.telegram ? (
                <TouchableOpacity onPress={() => Linking.openURL(author.telegram)}>
                  
                <FontAwesome5 name="telegram"  size={26} color="#333" style={styles.icon} />
                </TouchableOpacity>
              ) : null}
              {author.github ? (
                <TouchableOpacity onPress={() => Linking.openURL(author.github)}>
                  <FontAwesome name="github" size={30} color="#333" style={styles.icon} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const CARD_WIDTH = Dimensions.get('window').width / 2 - 30;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#39798F',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderTopWidth: 5,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#39798F',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  role: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
    textAlign: 'center',
  },
  desc: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    textAlign: 'center',
  },
  icons: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  icon: {
    padding: 4,
  },
});
