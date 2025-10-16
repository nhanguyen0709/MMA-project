import React, { useState, useContext } from "react";
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AuthContext } from "../../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng nhập</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button
        title={loading ? "Đang đăng nhập..." : "Đăng nhập"}
        onPress={async () => {
          setError("");
          setLoading(true);
          try {
            await login(email.trim(), password);
          } catch (e) {
            setError(e?.message || "Lỗi đăng nhập");
          } finally {
            setLoading(false);
          }
        }}
      />
      <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.linkWrap}>
        <Text style={styles.link}>Chưa có tài khoản? Đăng ký</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 12, padding: 10, borderRadius: 6 },
  linkWrap: { marginTop: 12, alignItems: "center" },
  link: { color: "#007AFF" },
  error: { color: "#d00", marginBottom: 8 },
});
