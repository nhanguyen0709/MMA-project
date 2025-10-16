import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import MainNavigator from "./MainNavigator";
import AuthNavigator from "./AuthNavigator";
import { AuthProvider, AuthContext } from "../context/AuthContext";
import { View, ActivityIndicator } from "react-native";

function RootNavigator() {
  const { user, initializing } = useContext(AuthContext);
  
  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  
  return user ? <MainNavigator /> : <AuthNavigator />;
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}


