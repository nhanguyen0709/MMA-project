import React, { useEffect, useState, useContext } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { getAllPhotos } from "../services/cloudinaryPhotoService";
import { AuthContext } from "../context/AuthContext";

export default function AlbumScreen({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const [photos, setPhotos] = useState([]);
  const ownerId = route?.params?.userId || user?.id;
  const { width } = useWindowDimensions();
  const column = width >= 720 ? 3 : width >= 480 ? 3 : 2;
  const itemSize = Math.floor((width - 24 - (column - 1) * 8) / column);

  useEffect(() => {
    (async () => {
      if (ownerId) {
        const data = await getAllPhotos(ownerId);
        setPhotos(data);
      }
    })();
  }, [ownerId]);

  const openDetail = (photo) => {
    navigation.navigate("Timeline", { screen: "Detail", params: { photo } });
  };

  const filterByLabel = (keyword) =>
    photos.filter((p) => {
      if (!Array.isArray(p.labels)) return keyword === "unknown";
      return p.labels.some((label) => label.toLowerCase().includes(keyword.toLowerCase()));
    });

  const renderSection = (title, items) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>
        {items.map((p) => (
          <TouchableOpacity key={p.id} onPress={() => openDetail(p)}>
            <Image source={{ uri: p.uri }} style={{ width: itemSize, height: itemSize, borderRadius: 10 }} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, padding: 12 }}>
      {renderSection("Gần đây", [...photos].reverse().slice(0, 12))}
      {renderSection("Chủ đề: unknown", filterByLabel("unknown"))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});


