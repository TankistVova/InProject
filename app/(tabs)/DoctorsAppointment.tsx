import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isBefore, startOfDay, isEqual } from 'date-fns';

interface Appointment {
  doctor: string;
  specialty: string;
  date: string;
  time: string;
}

const DoctorsAppointment: React.FC = () => {
  const [doctor, setDoctor] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>('Терапевт');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const router = useRouter();

  const specialties = [
    'Терапевт', 'Педиатр', 'Стоматолог', 'Хирург', 'Кардиолог', 
    'Офтальмолог', 'Невролог', 'Гинеколог', 'Уролог', 'Эндокринолог',
    'Ревматолог', 'Психотерапевт', 'Диетолог', 'Физиотерапевт', 
    'Онколог', 'ЛОР (отоларинголог)', 'Аллерголог', 'Пульмонолог',
    'Гастроэнтеролог', 'Травматолог'
  ];

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) {
      setSelectedTime(time);
    }
  };

  const isValidAppointment = (): boolean => {
    const appointmentDate = startOfDay(selectedDate);
    const today = startOfDay(new Date());
    
    if (isBefore(appointmentDate, today)) {
      Alert.alert('Ошибка', 'Дата должна быть сегодняшней или будущей.');
      return false;
    }

    if (isEqual(appointmentDate, today)) {
      const currentTime = new Date();
      const appTime = new Date(selectedDate);
      appTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      
      if (isBefore(appTime, currentTime)) {
        Alert.alert('Ошибка', 'Время для сегодняшней записи должно быть в будущем.');
        return false;
      }
    }

    return true;
  };

  const handleAddAppointment = async () => {
    if (!doctor || !specialty) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля.');
      return;
    }

    if (!isValidAppointment()) {
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const timeStr = format(selectedTime, 'HH:mm');

    const appointment: Appointment = { 
      doctor: `Док. ${doctor}`, 
      specialty, 
      date: dateStr, 
      time: timeStr 
    };

    try {
      const storedAppointments = await AsyncStorage.getItem('appointments');
      const appointments: Appointment[] = storedAppointments ? JSON.parse(storedAppointments) : [];

      appointments.push(appointment);
      await AsyncStorage.setItem('appointments', JSON.stringify(appointments));

      Alert.alert('Успех', 'Запись успешно добавлена!');
      setDoctor('');
      setSpecialty('Терапевт');
      setSelectedDate(new Date());
      setSelectedTime(new Date());
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

      <Text style={styles.label}>Дата:</Text>
      <TouchableOpacity 
        style={styles.input} 
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.pickerText}>
          {format(selectedDate, 'yyyy-MM-dd')}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      <Text style={styles.label}>Время:</Text>
      <TouchableOpacity 
        style={styles.input} 
        onPress={() => setShowTimePicker(true)}
      >
        <Text style={styles.pickerText}>
          {format(selectedTime, 'HH:mm')}
        </Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'android' ? 'clock' : 'spinner'}
          onChange={handleTimeChange}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleAddAppointment}>
        <Text style={styles.buttonText}>Добавить запись</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.cancelButton]} 
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Отмена</Text>
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
    justifyContent: 'center',
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
    color: '#333',
  },
  pickerText: {
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#39798F',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default DoctorsAppointment;