import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";

export default function FriendProfileScreen({ route, navigation }) {
  const { friend } = route.params || {};
  if (!friend) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hồ sơ</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{friend.email}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>ID</Text>
        <Text style={styles.value}>{friend.id}</Text>
      </View>
      <Button title="Xem Album" onPress={() => navigation.navigate("FriendAlbum", { friend })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  card: { backgroundColor: "#f5f5f5", padding: 12, borderRadius: 8, marginBottom: 12 },
  label: { fontSize: 12, color: "#666" },
  value: { fontSize: 16, fontWeight: "600" },
});
