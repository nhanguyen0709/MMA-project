import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import * as MediaLibrary from "expo-media-library";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen({ navigation }) {
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === "granted") {
        const album = await MediaLibrary.getAssetsAsync({
          first: 10,
          sortBy: [["creationTime", false]],
          mediaType: "photo",
        });
        setGallery(album.assets);
      }
    })();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📷 Ảnh gần đây</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {gallery.slice(0, 8).map((item) => (
          <Image key={item.id} source={{ uri: item.uri }} style={styles.thumb} />
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.captureButton} onPress={() => navigation.navigate("Camera")}>
        <Ionicons name="camera" size={26} color="#fff" />
        <Text style={styles.captureText}>Chụp ảnh mới</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  thumb: { width: 120, height: 120, marginRight: 10, borderRadius: 10 },
  captureButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  captureText: { color: "#fff", marginLeft: 8, fontSize: 16 },
});


