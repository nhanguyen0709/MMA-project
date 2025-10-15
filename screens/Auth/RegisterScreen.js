// src/screens/Auth/RegisterScreen.js
import React, { useState, useContext } from "react";
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AuthContext } from "../../context/AuthContext";

export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng ký</Text>
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
        placeholder="Mật khẩu (>=6 ký tự)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Nhập lại mật khẩu"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button
        title={loading ? "Đang đăng ký..." : "Đăng ký"}
        onPress={async () => {
          setError("");
          if (!email.trim() || !password) {
            setError("Nhập email và mật khẩu");
            return;
          }
          if (password.length < 6) {
            setError("Mật khẩu phải >= 6 ký tự");
            return;
          }
          if (password !== confirm) {
            setError("Mật khẩu nhập lại không khớp");
            return;
          }
          setLoading(true);
          try {
            await register(email.trim(), password);
            // Optionally navigate to Login or rely on auth state switch
            // navigation.navigate("Login");
          } catch (e) {
            setError(e?.message || "Lỗi đăng ký");
          } finally {
            setLoading(false);
          }
        }}
      />
      <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.linkWrap}>
        <Text style={styles.link}>Đã có tài khoản? Đăng nhập</Text>
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
