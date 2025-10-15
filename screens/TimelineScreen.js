import React, { useEffect, useState } from "react";
import { FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { getAllPhotosForCurrentUser } from "../services/photoService";

export default function TimelineScreen({ navigation }) {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      const data = await getAllPhotosForCurrentUser();
      setPhotos([...data].reverse());
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <FlatList
      data={photos}
      numColumns={2}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate("Detail", { photo: item })} style={styles.gridItem}>
          <Image source={{ uri: item.uri }} style={styles.gridImage} />
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  gridItem: { flex: 1, margin: 5 },
  gridImage: { width: "100%", height: 180, borderRadius: 10 },
});


