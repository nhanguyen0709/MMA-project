import React, { useEffect, useState, useRef, useContext } from "react";
import { View, TextInput, Image, Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, Text } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system/legacy";
import { savePhotoToCloudinary } from "../services/cloudinaryPhotoService";
import { AuthContext } from "../context/AuthContext";

export default function CameraScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [photo, setPhoto] = useState(null);
  const [note, setNote] = useState("");
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      await Location.requestForegroundPermissionsAsync();
    })();
    return () => { mountedRef.current = false; };
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
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      if (cameraRef.current) {
        const shot = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
          skipProcessing: false,
        });

        const loc = await Location.getCurrentPositionAsync({});
        const fileName = `photo_${Date.now()}.jpg`;
        const targetUri = `${FileSystem.cacheDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(targetUri, shot.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const fileInfo = await FileSystem.getInfoAsync(targetUri);
        if (!mountedRef.current) return; // component unmounted, abort state updates
        if (fileInfo.exists) {
          setPhoto({ uri: targetUri, fileName, width: shot.width, height: shot.height });
          setCoords(loc.coords);
        } else {
          throw new Error("Failed to create local file");
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Lỗi chụp ảnh: " + (error?.message || String(error)));
    } finally {
      if (mountedRef.current) setIsCapturing(false);
    }
  };

  const onSave = async () => {
    if (!photo || !coords) return alert("Chụp ảnh trước đã 😅");
    setLoading(true);

    try {
      const isSelfie = facing === "front";
      const created = await savePhotoToCloudinary({ uri: photo.uri, coords, note, labels: [], isSelfie, source: "camera" }, user.id);

      try {
        await FileSystem.deleteAsync(photo.uri, { idempotent: true });
      } catch (cleanupError) {
        console.warn("Cleanup error:", cleanupError);
      }

      if (!mountedRef.current) return;
      setLoading(false);
      setPhoto(null);
      setNote("");
      navigation.navigate("Timeline", { screen: "Detail", params: { photo: created } });
    } catch (error) {
      if (mountedRef.current) setLoading(false);
      console.error("Save error:", error);
      alert("Lỗi lưu ảnh: " + (error?.message || String(error)));
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      {!photo ? (
        <View style={{ flex: 1 }}>
          <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => setFacing((cur) => (cur === "back" ? "front" : "back"))} disabled={isCapturing}>
              <Text style={styles.text}>🔄 Đổi camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.captureButton, isCapturing && { opacity: 0.6 }]} onPress={takePhoto} disabled={isCapturing}>
              <Text style={styles.captureText}>{isCapturing ? "⏳" : "📸"}</Text>
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
