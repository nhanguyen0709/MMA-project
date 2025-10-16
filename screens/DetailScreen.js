import React, { useEffect, useState, useContext } from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { AuthContext } from "../context/AuthContext";
import { subscribePhotoUpdates } from "../services/cloudinaryPhotoService";

export default function DetailScreen({ route }) {
  const initialPhoto = route?.params?.photo;
  const { user } = useContext(AuthContext);
  const [photo, setPhoto] = useState(initialPhoto);

  useEffect(() => {
    if (user && initialPhoto?.id) {
      const unsubscribe = subscribePhotoUpdates(user.id, initialPhoto.id, setPhoto, 1500);
      return unsubscribe;
    }
  }, [user?.id, initialPhoto?.id]);

  if (!photo) return <View style={styles.center}><Text>Không có ảnh 🥲</Text></View>;

  return (
    <View style={styles.container}>
      <Image source={{ uri: photo.uri }} style={styles.image} />
      <View style={styles.meta}>
        <Text style={styles.text}>🕒 {new Date(photo.timestamp).toLocaleString()}</Text>
        <Text style={styles.text}>👤 User: {photo.userId}</Text>
        <Text style={styles.text}>📐 {photo.width}×{photo.height}</Text>
        <Text style={styles.text}>🧭 {photo.coords?.latitude?.toFixed(5)}, {photo.coords?.longitude?.toFixed(5)}</Text>
        <Text style={styles.text}>📝 {photo.note || "Không có ghi chú"}</Text>
        <Text style={styles.text}>🏷️ {Array.isArray(photo.labels) && photo.labels.length ? photo.labels.join(", ") : "Đang nhận diện..."}</Text>
      </View>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: photo.coords.latitude,
          longitude: photo.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        <Marker coordinate={photo.coords} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  image: { width: "100%", height: 300 },
  meta: { paddingHorizontal: 12, paddingVertical: 8 },
  text: { fontSize: 15, marginVertical: 4 },
  map: { flex: 1, height: 250 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});


