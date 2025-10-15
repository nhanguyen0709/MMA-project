// src/navigation/MainNavigator.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../screens/HomeScreen";
import CameraScreen from "../screens/CameraScreen";
import TimelineScreen from "../screens/TimelineScreen";
import DetailScreen from "../screens/DetailScreen";
import MapScreen from "../screens/MapScreen";
import AlbumScreen from "../screens/AlbumScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TimelineStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="TimelineList" component={TimelineScreen} options={{ title: "🕒 Timeline" }} />
      <Stack.Screen name="Detail" component={DetailScreen} options={{ title: "Chi tiết ảnh" }} />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
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
      <Tab.Screen name="Timeline" component={TimelineStack} options={{ headerShown: false }} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Album" component={AlbumScreen} />
    </Tab.Navigator>
  );
}
