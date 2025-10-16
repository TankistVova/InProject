import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Linking,
} from "react-native";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";

interface Pharmacy {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export default function PharmacyMapScreen() {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const MAPTILER_API_KEY = "GOcgblxG2p8oMIGrWQCp";
  const screenHeight = Dimensions.get("window").height;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Нужно разрешение на доступ к геолокации!");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setLoading(false);

      fetchNearbyPharmacies(loc.coords.latitude, loc.coords.longitude);
    })();
  }, []);

  const fetchNearbyPharmacies = async (latitude: number, longitude: number) => {
    try {
      const radius = 1000;
      const url = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity=pharmacy](around:${radius},${latitude},${longitude});out;`;
      const response = await fetch(url);
      const data = await response.json();

      const results: Pharmacy[] = data.elements.map((el: any) => ({
        id: el.id.toString(),
        name: el.tags?.name || "Аптека",
        lat: el.lat,
        lon: el.lon,
      }));

      setPharmacies(results);
    } catch (error) {
      console.error("Ошибка загрузки аптек:", error);
    }
  };

  const openMaps = (lat: number, lon: number) => {
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`;
    Linking.openURL(googleUrl);
  };

  if (loading || !location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text>Загрузка карты...</Text>
      </View>
    );
  }

  // Генерация HTML для WebView с MapTiler и кастомными маркерами
  const mapHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        const map = L.map('map').setView([${location.latitude}, ${location.longitude}], 15);

        L.tileLayer('https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}', {
          attribution: '<a href="https://www.maptiler.com/">MapTiler</a>',
          tileSize: 512,
          zoomOffset: -1
        }).addTo(map);

        // Маркер пользователя — выделенный
        L.circleMarker([${location.latitude}, ${location.longitude}], {
          radius: 12,
          color: 'white',
          weight: 3,
          fillColor: '#4CAF50',
          fillOpacity: 1,
        }).addTo(map).bindPopup('Вы здесь').openPopup();

        // Маркеры аптек — цвет #39798F
        const pharmacies = ${JSON.stringify(pharmacies)};
        pharmacies.forEach(ph => {
          L.circleMarker([ph.lat, ph.lon], {
            radius: 8,
            color: '#39798F',
            weight: 2,
            fillColor: '#39798F',
            fillOpacity: 1,
          }).addTo(map).bindPopup(ph.name);
        });
      </script>
    </body>
  </html>
  `;

  return (
    <View style={{ flex: 1 }}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={{ flex: 1 }}
      />

      <View style={[styles.listContainer, { maxHeight: screenHeight * 0.35 }]}>
        <Text style={styles.listTitle}>Ближайшие аптеки:</Text>
        {pharmacies.length === 0 ? (
          <Text style={styles.noPharmacies}>Аптеки не найдены</Text>
        ) : (
          <FlatList
            data={pharmacies}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardText}>{item.name}</Text>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => openMaps(item.lat, item.lon)}
                >
                  <Text style={styles.buttonText}>Построить маршрут</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 10,
  },
  listTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  noPharmacies: {
    fontStyle: "italic",
    color: "gray",
  },
  card: {
    backgroundColor: "#F0F0F0",
    padding: 10,
    borderRadius: 10,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardText: {
    fontSize: 14,
  },
  button: {
    marginTop: 5,
    backgroundColor: "#39798F",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
  },
});
