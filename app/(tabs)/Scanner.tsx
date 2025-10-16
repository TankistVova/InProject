import React, { useState } from 'react';
// 31809.BcDJ4fkaVVnRWnjBh
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const API_TOKEN = '31809.BcDJ4fkaVVnRWnjBh';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export default function ScanScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImagePick = async (useCamera: boolean) => {
    try {
      const permissionResult = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        alert('Требуется разрешение на доступ');
        return;
      }

      const result = await (useCamera
        ? ImagePicker.launchCameraAsync()
        : ImagePicker.launchImageLibraryAsync());

      if (!result.canceled && result.assets?.[0]?.uri) {
        setSelectedImage(result.assets[0].uri);
        await processReceipt(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Ошибка выбора изображения:', error);
      alert('Ошибка при выборе изображения');
    }
  };

  const processReceipt = async (uri: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('qrfile', {
        uri,
        name: 'receipt.jpg',
        type: 'image/jpeg',
      } as any);
      formData.append('token', API_TOKEN);

      const response = await fetch('https://proverkacheka.com/api/v1/check/get', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      
      if (data?.data?.json?.items) {
        setItems(data.data.json.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price / 100
        })));
      } else {
        alert('Не удалось распознать чек');
        setItems([]);
      }
    } catch (error) {
      console.error('Ошибка обработки:', error);
      alert('Ошибка при обработке чека');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item: ReceiptItem) => {
    router.push({
      pathname: '/AddMedicine',
      params: {
        scannedName: item.name,
        scannedQuantity: item.quantity.toString(),
        _timestamp: Date.now().toString()
      }
    });
  };

  return (
    <LinearGradient colors={['#f8f9fa', '#e9ecef']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Секция QR-кода */}
        <View style={styles.qrSection}>
          <View style={styles.qrFrame}>
            <Image
              source={require('../styles/images/scanner.png')}
              style={styles.qrImage}
            />
          </View>
          <Text style={styles.mainText}>СКАН ЧЕКОВ</Text>
          <Text style={styles.subText}>
            Можете отсканировать чек для автоматического заполнения лекарств
          </Text>
        </View>

        {/* Результаты или кнопки */}
        {items.length > 0 ? (
          <View style={styles.resultCard}>
            <Text style={styles.sectionTitle}>Распознанные товары</Text>
            {items.map((item, index) => (
              <TouchableOpacity
                key={`item-${index}`}
                style={styles.itemCard}
                onPress={() => handleItemPress(item)}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemDetails}>
                  <Text style={styles.detailText}>Кол-во: {item.quantity}</Text>
                  <Text style={styles.priceText}>{item.price.toFixed(2)} ₽</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => handleImagePick(true)}>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonTitle}>Сканировать чек</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.button}
              onPress={() => handleImagePick(false)}>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonTitle}>Выбрать из галереи</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.push('/AddMedicine')}>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonTitle}>Добавить вручную</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Анализируем чек...</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  qrSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  qrFrame: {
    width: 350,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginBottom: 20,
    overflow: 'hidden',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  mainText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  buttonsContainer: {
    marginBottom: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#39798F',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailText: {
    color: '#666666',
    fontSize: 14,
  },
  priceText: {
    color: '#2F80ED',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#2F80ED',
    fontSize: 16,
  },
});