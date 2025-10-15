import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { getAllPhotosForCurrentUser } from "../services/photoService";

export default function AlbumScreen({ navigation }) {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getAllPhotosForCurrentUser();
      setPhotos(data);
    })();
  }, []);

  const filterByLabel = (keyword) =>
    photos.filter((p) => {
      if (!Array.isArray(p.labels)) return keyword === "unknown";
      return p.labels.some((label) => label.toLowerCase().includes(keyword.toLowerCase()));
    });

  const renderSection = (title, keyword) => (
    <View style={{ marginVertical: 10 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView horizontal>
        {filterByLabel(keyword).map((p) => (
          <TouchableOpacity key={p.id} onPress={() => navigation.navigate("Detail", { photo: p })}>
            <Image source={{ uri: p.uri }} style={styles.albumImage} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, padding: 10 }}>
      {renderSection("🧍 Ảnh Người", "person")}
      {renderSection("🐶 Ảnh Vật / Động vật", "animal")}
      {renderSection("🌄 Ảnh Phong Cảnh", "outdoor")}
      {renderSection("🌀 Khác", "unknown")}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: "bold", fontSize: 16, marginVertical: 5 },
  albumImage: { width: 120, height: 120, marginRight: 10, borderRadius: 10 },
});


