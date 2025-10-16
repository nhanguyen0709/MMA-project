// Simple auth service using AsyncStorage
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "current_user";
const USERS_KEY = "users_data";

export async function registerUser(email, password) {
  try {
    const users = await getAllUsers();
    
    // Check if user already exists
    if (users.find(user => user.email === email)) {
      throw new Error("Email đã được sử dụng");
    }
    
    const userId = Date.now().toString();
    const newUser = {
      id: userId,
      email,
      password, // In production, hash this password
      createdAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Auto login after registration
    await loginUser(email, password);
    
    return newUser;
  } catch (error) {
    throw new Error(error.message || "Lỗi đăng ký");
  }
}

export async function loginUser(email, password) {
  try {
    const users = await getAllUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }
    
    // Save current user
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  } catch (error) {
    throw new Error(error.message || "Lỗi đăng nhập");
  }
}

export async function logoutUser() {
  await AsyncStorage.removeItem(AUTH_KEY);
}

export async function getCurrentUser() {
  const userData = await AsyncStorage.getItem(AUTH_KEY);
  return userData ? JSON.parse(userData) : null;
}

export async function getAllUsers() {
  const usersData = await AsyncStorage.getItem(USERS_KEY);
  return usersData ? JSON.parse(usersData) : [];
}
