import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Login Screen - Initial Route */}
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        {/* Signup Screen */}
        <Stack.Screen
          name="signup"
          options={{
            title: "Sign Up",
            headerBackTitle: "Login",
          }}
        />

        {/* Dashboard Screen */}
        <Stack.Screen
          name="dashboard"
          options={{
            headerShown: false,
          }}
        />

        {/* File Viewer Screen */}
        <Stack.Screen
          name="file-viewer"
          options={{
            title: "File Details",
            headerBackTitle: "Back",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
