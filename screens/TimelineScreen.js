import React, { useEffect, useState, useContext } from "react";
import { FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { getAllPhotos } from "../services/cloudinaryPhotoService";
import { AuthContext } from "../context/AuthContext";

export default function TimelineScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      if (user) {
        const data = await getAllPhotos(user.id);
        setPhotos([...data].reverse());
      }
    });
    return unsubscribe;
  }, [navigation, user]);

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


