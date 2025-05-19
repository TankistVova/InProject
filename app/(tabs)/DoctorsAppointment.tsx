import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

interface Appointment {
  doctor: string;
  specialty: string;
  date: string;
  time: string;
}

const DoctorsAppointment: React.FC = () => {
  const [doctor, setDoctor] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>('Терапевт');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');

  const router = useRouter();

  useEffect(() => {
    const clearStorage = async () => {
      await AsyncStorage.clear();
      console.log('AsyncStorage очищен перед тестированием.');
    };

    clearStorage();
  }, []);

  const specialties = [
    'Терапевт', 'Педиатр', 'Стоматолог', 'Хирург', 'Кардиолог', 
    'Офтальмолог', 'Невролог', 'Гинеколог', 'Уролог', 'Эндокринолог',
    'Ревматолог', 'Психотерапевт', 'Диетолог', 'Физиотерапевт', 
    'Онколог', 'ЛОР (отоларинголог)', 'Аллерголог', 'Пульмонолог',
    'Гастроэнтеролог', 'Травматолог'
  ];

  const isValidDate = (inputDate: string): boolean => {
    return /^\d{4}-\d{2}-\d{2}$/.test(inputDate);
  };

  const isValidTime = (inputTime: string): boolean => {
    return /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(inputTime);
  };

  const handleAddAppointment = async () => {
    if (!doctor || !specialty || !date || !time) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля.');
      return;
    }

    if (!isValidDate(date)) {
      Alert.alert('Ошибка', 'Введите дату в формате ГГГГ-ММ-ДД (например, 2025-03-20).');
      return;
    }

    if (!isValidTime(time)) {
      Alert.alert('Ошибка', 'Введите время в формате ЧЧ:ММ (например, 10:30).');
      return;
    }

    const appointment: Appointment = { doctor: `Док. ${doctor}`, specialty, date, time };

    try {
      const storedAppointments = await AsyncStorage.getItem('appointments');
      const appointments: Appointment[] = storedAppointments ? JSON.parse(storedAppointments) : [];

      appointments.push(appointment);
      await AsyncStorage.setItem('appointments', JSON.stringify(appointments));

      Alert.alert('Успех', 'Запись успешно добавлена!');
      router.back();
    } catch (error) {
      console.error('Ошибка при добавлении записи:', error);
      Alert.alert('Ошибка', 'Не удалось добавить запись. Попробуйте снова.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Запись к врачу</Text>

      <TextInput
        style={styles.input}
        placeholder="Имя врача"
        value={doctor}
        onChangeText={setDoctor}
      />

      <Text style={styles.label}>Специальность:</Text>
      <Picker
        selectedValue={specialty}
        style={styles.picker}
        onValueChange={(itemValue) => setSpecialty(itemValue)}
      >
        {specialties.map((spec, index) => (
          <Picker.Item key={index} label={spec} value={spec} />
        ))}
      </Picker>

      <TextInput
        style={styles.input}
        placeholder="Дата (ГГГГ-ММ-ДД)"
        value={date}
        onChangeText={setDate}
      />

      <TextInput
        style={styles.input}
        placeholder="Время (ЧЧ:ММ)"
        value={time}
        onChangeText={setTime}
      />

      <TouchableOpacity style={styles.button} onPress={handleAddAppointment}>
        <Text style={styles.buttonText}>Добавить запись</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#39798F',
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    paddingLeft: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  picker: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#39798F',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default DoctorsAppointment;
