import React, { useEffect, useState, useRef, useContext } from "react";
import { View, TextInput, Image, Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, Text } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system/legacy";
import { classifyImage } from "../services/aiService";
import { savePhotoToCloudinary } from "../services/cloudinaryPhotoService";
import { AuthContext } from "../context/AuthContext";

export default function CameraScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [photo, setPhoto] = useState(null);
  const [note, setNote] = useState("");
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>Cần quyền truy cập camera</Text>
        <Button onPress={requestPermission} title="Cấp quyền" />
      </View>
    );
  }

  const takePhoto = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
          skipProcessing: false,
        });

        const loc = await Location.getCurrentPositionAsync({});
        const fileName = `photo_${Date.now()}.jpg`;
        const targetUri = `${FileSystem.cacheDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(targetUri, photo.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const fileInfo = await FileSystem.getInfoAsync(targetUri);
        if (fileInfo.exists) {
          setPhoto({ uri: targetUri, fileName, width: photo.width, height: photo.height });
          setCoords(loc.coords);
        } else {
          throw new Error("Failed to create local file");
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Lỗi chụp ảnh: " + error.message);
    }
  };

  const onSave = async () => {
    if (!photo || !coords) return alert("Chụp ảnh trước đã 😅");
    setLoading(true);

    try {
      // Upload to Cloudinary and save metadata
      const labels = await classifyImage(photo.uri);
      await savePhotoToCloudinary({ uri: photo.uri, coords, note, labels }, user.id);

      // 4️⃣ Xoá file tạm
      try {
        await FileSystem.deleteAsync(photo.uri, { idempotent: true });
      } catch (cleanupError) {
        console.warn("Cleanup error:", cleanupError);
      }

      setLoading(false);
      setPhoto(null);
      setNote("");
      navigation.navigate("Timeline");
    } catch (error) {
      setLoading(false);
      console.error("Save error:", error);
      alert("Lỗi lưu ảnh: " + error.message);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      {!photo ? (
        <View style={{ flex: 1 }}>
          <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => setFacing((cur) => (cur === "back" ? "front" : "back"))}>
              <Text style={styles.text}>🔄 Đổi camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <Text style={styles.captureText}>📸</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <Image source={{ uri: photo.uri }} style={styles.preview} />
          <TextInput
            style={styles.noteInput}
            placeholder="✏️ Viết ghi chú..."
            value={note}
            onChangeText={setNote}
            onSubmitEditing={onSave}
          />
          <View style={styles.buttonRow}>
            <Button title="🔄 Chụp lại" onPress={() => setPhoto(null)} />
            <Button title={loading ? "⏳ Đang lưu..." : "💾 Lưu ảnh"} onPress={onSave} />
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  camera: { flex: 1 },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "transparent",
    padding: 64,
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  button: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 5,
  },
  text: { fontSize: 16, color: "white" },
  captureButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
    borderRadius: 50,
    alignSelf: "center",
  },
  captureText: { fontSize: 24, color: "white" },
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
  buttonRow: { flexDirection: "row", justifyContent: "space-around", width: "90%" },
});
