import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { getAllPhotos } from "../services/cloudinaryPhotoService";

export default function FriendAlbumScreen({ route, navigation }) {
  const { friend } = route.params || {};
  const [photos, setPhotos] = useState([]);
  const { width } = useWindowDimensions();
  const column = width >= 720 ? 3 : width >= 480 ? 2 : 2;
  const itemSize = Math.floor((width - 24 - (column - 1) * 8) / column);

  useEffect(() => {
    navigation.setOptions({ title: friend?.email ? `Album • ${friend.email}` : "Album bạn" });
  }, [friend]);

  useEffect(() => {
    (async () => {
      if (friend?.id) {
        const data = await getAllPhotos(friend.id);
        setPhotos(data);
      }
    })();
  }, [friend?.id]);

  const openDetail = (photo) => {
    navigation.navigate("Timeline", { screen: "Detail", params: { photo } });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 12 }}>
      <View style={[styles.grid, { gap: 8 }]}>
        {photos.map((p) => (
          <TouchableOpacity key={p.id} onPress={() => openDetail(p)}>
            <Image source={{ uri: p.uri }} style={{ width: itemSize, height: itemSize, borderRadius: 10 }} />
          </TouchableOpacity>
        ))}
      </View>
      {photos.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Chưa có ảnh nào</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap" },
  empty: { padding: 32, alignItems: "center" },
  emptyText: { color: "#666" },
});
