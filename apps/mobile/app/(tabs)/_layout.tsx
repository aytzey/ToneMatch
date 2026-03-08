import { MaterialIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";

import { useAuth } from "@/src/features/auth/use-auth";
import { palette } from "@/src/theme/palette";

export default function TabsLayout() {
  const { isAuthenticated, ready } = useAuth();

  if (!ready) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
        tabBarLabelStyle: {
          fontFamily: "Manrope_700Bold",
          fontSize: 10,
          letterSpacing: 1,
          textTransform: "uppercase",
        },
        tabBarStyle: {
          backgroundColor: palette.canvas,
          borderTopWidth: 1,
          borderTopColor: palette.border,
          paddingTop: 6,
          paddingBottom: 8,
          height: 64,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: "Wardrobe",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="checkroom" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="explore" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="photo-camera" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
