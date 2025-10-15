import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function DetailScreen({ route }) {
  const photo = route?.params?.photo;
  if (!photo) return <View style={styles.center}><Text>Không có ảnh 🥲</Text></View>;
  return (
    <View style={styles.container}>
      <Image source={{ uri: photo.uri }} style={styles.image} />
      <Text style={styles.text}>📝 {photo.note || "Không có ghi chú"}</Text>
      <Text style={styles.text}>🏷️ {Array.isArray(photo.labels) ? photo.labels.join(", ") : "unknown"}</Text>
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
  text: { fontSize: 15, margin: 6 },
  map: { flex: 1, height: 250 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});


