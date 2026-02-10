/**
 * Tabs Layout - Main app navigation with Inbox tab.
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getLoggedInUser, uploadMultipleFiles } from "@/services";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Tabs, useRouter } from "expo-router";
import { useCallback } from "react";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const performUpload = useCallback(
    async (
      assets: DocumentPicker.DocumentPickerAsset[],
      userIdParam: number,
    ) => {
      try {
        // Create a fake result object for uploadMultipleFiles
        const fakeResult = {
          assets,
          canceled: false,
        };

        const { saved, failed } = await uploadMultipleFiles(
          fakeResult as any,
          userIdParam,
        );

        console.log(
          "Upload result - Saved:",
          saved.length,
          "Failed:",
          failed.length,
        );

        // Navigate to dashboard and pass result params
        router.push({
          pathname: "/(tabs)/dashboard",
          params: {
            uploadDone: Date.now().toString(),
            savedCount: saved.length.toString(),
            failedCount: failed.length.toString(),
          },
        });
      } catch (error) {
        console.error("Error uploading files:", error);
      }
    },
    [router],
  );

  const handleUploadPress = useCallback(async () => {
    try {
      console.log("Opening document picker...");
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: "*/*",
        copyToCacheDirectory: true,
      });

      console.log("Picker result:", JSON.stringify(result, null, 2));

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log("Picker canceled or no files selected");
        return;
      }

      console.log("Files selected:", result.assets.length);

      // Get the logged-in user
      const user = await getLoggedInUser();
      console.log("User:", user);

      if (!user) {
        console.log("No user found, redirecting to login");
        router.push("/");
        return;
      }

      // Ensure user.id is a number and not null
      const userIdNum =
        typeof user.id === "string" ? parseInt(user.id, 10) : user.id;

      if (userIdNum === null || userIdNum === undefined) {
        console.error("Invalid user id:", userIdNum);
        router.push("/");
        return;
      }

      // Directly upload files without duplicate validation
      await performUpload(result.assets, userIdNum);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  }, [router]);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: colorScheme === "dark" ? "#666" : "#999",
          tabBarStyle: {
            backgroundColor: colorScheme === "dark" ? "#0a0a0a" : "#f9fafb",
            borderTopColor: Colors.primary,
            borderTopWidth: 2,
            height: 75,
            paddingBottom: 10,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 4,
            marginBottom: 2,
          },
          tabBarIconStyle: {
            marginBottom: 0,
          },
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.primary,
            borderBottomColor: colorScheme === "dark" ? "#333" : Colors.primary,
            borderBottomWidth: 0,
            elevation: 4,
            shadowColor: Colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 4,
          },
          headerTintColor: Colors.textWhite,
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 18,
          },
        }}
      >
        {/* Home Tab - Dashboard */}
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Files",
            tabBarLabel: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
            headerTitle: "My Files",
          }}
        />

        {/* Upload Tab - Center button that triggers picker */}
        <Tabs.Screen
          name="upload"
          listeners={({ navigation }: { navigation: any }) => ({
            tabPress: (e: any) => {
              e.preventDefault();
              handleUploadPress();
            },
          })}
          options={{
            title: "Upload",
            tabBarLabel: "Upload",
            tabBarIcon: ({ color }) => (
              <Ionicons name="add-circle" size={28} color={color} />
            ),
            headerShown: false,
          }}
        />

        {/* Inbox Tab - Files shared with me */}
        <Tabs.Screen
          name="inbox"
          options={{
            title: "Inbox",
            tabBarLabel: "Inbox",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="mail" size={size} color={color} />
            ),
            headerTitle: "Inbox",
          }}
        />

        {/* Profile Tab */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarLabel: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
            headerTitle: "My Profile",
          }}
        />
      </Tabs>
    </>
  );
}
