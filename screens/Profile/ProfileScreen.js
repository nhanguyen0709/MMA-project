import React, { useContext } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import { AuthContext } from "../../context/AuthContext";

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc muốn đăng xuất?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Đăng xuất", 
          style: "destructive",
          onPress: logout
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thông tin tài khoản</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>ID:</Text>
        <Text style={styles.value}>{user?.id}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Ngày tạo:</Text>
        <Text style={styles.value}>
          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
        </Text>
      </View>
      
      <Button 
        title="Đăng xuất" 
        onPress={handleLogout}
        color="#d00"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  infoContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    color: "#666",
  },
});
