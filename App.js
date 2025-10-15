import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";
import { fetch as tfFetch } from "@tensorflow/tfjs-react-native";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

async function classifyImage(uri) {
  try {
    await tf.ready();
    const model = await mobilenet.load();
    const response = await fetch(uri);
    const blob = await response.blob();
    const image = await createImageBitmap(blob);
    const tensor = await tf.browser.fromPixelsAsync(image);
    const predictions = await model.classify(tensor);
    return predictions.map((p) => p.className);
  } catch (e) {
    console.log("Classification error:", e);
    return ["unknown"];
  }
}

function HomeScreen({ navigation }) {
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
    <ScrollView contentContainerStyle={styles.homeContainer}>
      <Text style={styles.title}>📷 Ảnh gần đây</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {gallery.slice(0, 5).map((item) => (
          <Image
            key={item.id}
            source={{ uri: item.uri }}
            style={styles.albumImage}
          />
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.captureButton}
        onPress={() => navigation.navigate("Camera")}
      >
        <Ionicons name="camera" size={26} color="#fff" />
        <Text style={styles.captureText}>Chụp ảnh mới</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function CameraScreen({ navigation }) {
  const [photo, setPhoto] = useState(null);
  const [note, setNote] = useState("");
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const loc = await Location.getCurrentPositionAsync({});
      setPhoto(result.assets[0]);
      setLocation(loc.coords);
    }
  };

  const savePhoto = async () => {
    if (!photo || !location) return alert("Chụp ảnh trước đã 😅");
    setLoading(true);
    const labels = await classifyImage(photo.uri);
    const newPhoto = {
      id: Date.now().toString(),
      uri: photo.uri,
      coords: location,
      note,
      labels,
      timestamp: new Date().toLocaleString(),
    };
    const saved = JSON.parse(await AsyncStorage.getItem("photos")) || [];
    saved.push(newPhoto);
    await AsyncStorage.setItem("photos", JSON.stringify(saved));
    setLoading(false);
    setPhoto(null);
    setNote("");
    navigation.navigate("Timeline");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.cameraContainer}>
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
              onSubmitEditing={savePhoto}
            />
            <Button
              title={loading ? "⏳ Đang lưu..." : "💾 Lưu ảnh"}
              onPress={savePhoto}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TimelineScreen({ navigation }) {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      const data = JSON.parse(await AsyncStorage.getItem("photos")) || [];
      setPhotos(data.reverse());
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <FlatList
      data={photos}
      numColumns={2}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => navigation.navigate("Detail", { photo: item })}
          style={styles.gridItem}
        >
          <Image source={{ uri: item.uri }} style={styles.gridImage} />
        </TouchableOpacity>
      )}
    />
  );
}

function DetailScreen({ route }) {
  const photo = route?.params?.photo;
  if (!photo)
    return (
      <View style={styles.center}>
        <Text>Không có ảnh 🥲</Text>
      </View>
    );
  return (
    <View style={styles.detailContainer}>
      <Image source={{ uri: photo.uri }} style={styles.detailImage} />
      <Text style={styles.text}>📝 {photo.note || "Không có ghi chú"}</Text>
      <Text style={styles.text}>
        🏷️ {Array.isArray(photo.labels) ? photo.labels.join(", ") : "unknown"}
      </Text>
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

function MapScreen({ navigation }) {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    (async () => {
      const data = JSON.parse(await AsyncStorage.getItem("photos")) || [];
      setPhotos(data);
    })();
  }, []);

  return (
    <MapView style={styles.fullMap}>
      {photos.map((p) => (
        <Marker
          key={p.id}
          coordinate={p.coords}
          title={p.note || "Ảnh"}
          onPress={() => navigation.navigate("Detail", { photo: p })}
        />
      ))}
    </MapView>
  );
}

function AlbumScreen({ navigation }) {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    (async () => {
      const data = JSON.parse(await AsyncStorage.getItem("photos")) || [];
      setPhotos(data);
    })();
  }, []);

  // ✅ Fix lỗi 'Cannot read property some of undefined'
  const filterByLabel = (keyword) =>
    photos.filter((p) => {
      if (!Array.isArray(p.labels)) {
        return keyword === "unknown"; // nhóm vào mục "Khác"
      }
      return p.labels.some((label) =>
        label.toLowerCase().includes(keyword.toLowerCase())
      );
    });

  const renderSection = (title, keyword) => (
    <View style={{ marginVertical: 10 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView horizontal>
        {filterByLabel(keyword).map((p) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => navigation.navigate("Detail", { photo: p })}
          >
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

function TimelineStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Timeline"
        component={TimelineScreen}
        options={{ title: "🕒 Timeline" }}
      />
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={{ title: "Chi tiết ảnh" }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let icon;
            if (route.name === "Home") icon = "home";
            else if (route.name === "Camera") icon = "camera";
            else if (route.name === "Timeline") icon = "images";
            else if (route.name === "Map") icon = "map";
            else if (route.name === "Album") icon = "albums";
            return <Ionicons name={icon} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#007AFF",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Camera" component={CameraScreen} />
        <Tab.Screen
          name="Timeline"
          component={TimelineStack}
          options={{ headerShown: false }}
        />
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Album" component={AlbumScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  homeContainer: { alignItems: "center", padding: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  albumImage: { width: 120, height: 120, marginRight: 10, borderRadius: 10 },
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
  cameraContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
  gridItem: { flex: 1, margin: 5 },
  gridImage: { width: "100%", height: 180, borderRadius: 10 },
  detailContainer: { flex: 1, backgroundColor: "#fff" },
  detailImage: { width: "100%", height: 300 },
  text: { fontSize: 15, margin: 6 },
  map: { flex: 1, height: 250 },
  fullMap: { flex: 1 },
  sectionTitle: { fontWeight: "bold", fontSize: 16, marginVertical: 5 },
});


