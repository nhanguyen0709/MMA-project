import React, { useEffect, useState } from "react";
import { View, TextInput, Image, Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { classifyImage } from "../services/aiService";
import { savePhotoForUser } from "../services/photoService";

export default function CameraScreen({ navigation }) {
  const [photo, setPhoto] = useState(null);
  const [note, setNote] = useState("");
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await Location.requestForegroundPermissionsAsync();
      await MediaLibrary.requestPermissionsAsync();
    })();
  }, []);

  const resolveLocalUri = async (asset) => {
    // On iOS, edited assets may return ph:// URIs. Resolve to localUri via MediaLibrary
    try {
      if (asset?.uri?.startsWith("ph://")) {
        // Try using existing assetId when available
        if (asset.assetId) {
          const info = await MediaLibrary.getAssetInfoAsync(asset.assetId);
          if (info?.localUri) return info.localUri;
        }
        // Fallback: create a MediaLibrary asset from the ph:// uri, then resolve
        const created = await MediaLibrary.createAssetAsync(asset.uri);
        const info2 = await MediaLibrary.getAssetInfoAsync(created.id);
        if (info2?.localUri) return info2.localUri;
      }
    } catch {}
    return asset?.uri;
  };

  const ensureFileUri = async (asset) => {
    const resolved = await resolveLocalUri(asset);
    if (resolved?.startsWith("file://")) return resolved;
    // As last resort, copy to cache as a file://
    try {
      const target = `${FileSystem.cacheDirectory}${Date.now()}-photo.jpg`;
      await FileSystem.copyAsync({ from: asset.uri, to: target });
      return target;
    } catch {
      return asset.uri;
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8, saveToPhotos: false });
    if (!result.canceled) {
      const loc = await Location.getCurrentPositionAsync({});
      const asset = result.assets[0];
      const localUri = await ensureFileUri(asset);
      setPhoto({ ...asset, uri: localUri });
      setCoords(loc.coords);
    }
  };

  const onSave = async () => {
    if (!photo || !coords) return alert("Chụp ảnh trước đã 😅");
    setLoading(true);
    const labels = await classifyImage(photo.uri);
    await savePhotoForUser({ uri: photo.uri, coords, note, labels });
    setLoading(false);
    setPhoto(null);
    setNote("");
    navigation.navigate("Timeline");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {!photo ? (
          <Button title="📸 Chụp ảnh" onPress={takePhoto} />
        ) : (
          <>
            <Image source={{ uri: photo.uri }} style={styles.preview} />
            <TextInput
              style={styles.noteInput}
              placeholder="✏️ Viết ghi chú..."
              value={note}
              onChangeText={setNote}
              onSubmitEditing={onSave}
            />
            <Button title={loading ? "⏳ Đang lưu..." : "💾 Lưu ảnh"} onPress={onSave} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  preview: { width: "90%", height: 400, borderRadius: 10, marginBottom: 10 },
  noteInput: {
    borderColor: "#aaa",
    borderWidth: 1,
    width: "90%",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
});


