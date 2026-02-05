import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getFileByName, getLoggedInUser, saveMultipleFiles } from "@/services";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Tabs, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [duplicateFile, setDuplicateFile] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingAssets, setPendingAssets] = useState<
    DocumentPicker.DocumentPickerAsset[]
  >([]);
  const [approvedAssets, setApprovedAssets] = useState<
    DocumentPicker.DocumentPickerAsset[]
  >([]);
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
  const [userId, setUserId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  // Check each asset for duplicates and collect approved ones
  const processDuplicateCheck = useCallback(
    async (
      assets: DocumentPicker.DocumentPickerAsset[],
      userIdParam: number,
      userEmailParam: string,
    ) => {
      setUserId(userIdParam);
      setUserEmail(userEmailParam);
      setPendingAssets(assets);
      setApprovedAssets([]);
      setCurrentAssetIndex(0);

      // Check first file
      if (assets.length > 0) {
        const firstAsset = assets[0];
        const existing = await getFileByName(firstAsset.name);
        if (existing) {
          setDuplicateFile(firstAsset.name);
          setShowDuplicateModal(true);
        } else {
          // Not a duplicate, add to approved and move to next
          handleUploadAgain();
        }
      }
    },
    [],
  );

  const handleUploadAgain = useCallback(async () => {
    setShowDuplicateModal(false);

    const nextIndex = currentAssetIndex + 1;
    const newApproved = [...approvedAssets, pendingAssets[currentAssetIndex]];
    setApprovedAssets(newApproved);

    // Check next file
    if (nextIndex < pendingAssets.length) {
      const nextAsset = pendingAssets[nextIndex];
      const existing = await getFileByName(nextAsset.name);
      setCurrentAssetIndex(nextIndex);

      if (existing) {
        setDuplicateFile(nextAsset.name);
        setShowDuplicateModal(true);
      } else {
        // Recursive call for non-duplicates
        setCurrentAssetIndex(nextIndex);
        handleUploadAgain();
      }
    } else {
      // All files processed, now save the approved ones
      if (newApproved.length > 0 && userId && userEmail) {
        await performUpload(newApproved, userId, userEmail);
      }
    }
  }, [currentAssetIndex, pendingAssets, approvedAssets, userId, userEmail]);

  const handleSkip = useCallback(async () => {
    setShowDuplicateModal(false);

    const nextIndex = currentAssetIndex + 1;

    // Check next file
    if (nextIndex < pendingAssets.length) {
      const nextAsset = pendingAssets[nextIndex];
      const existing = await getFileByName(nextAsset.name);
      setCurrentAssetIndex(nextIndex);

      if (existing) {
        setDuplicateFile(nextAsset.name);
        setShowDuplicateModal(true);
      } else {
        // Move to next non-duplicate
        handleSkip();
      }
    } else {
      // All files processed, now save the approved ones
      if (approvedAssets.length > 0 && userId && userEmail) {
        await performUpload(approvedAssets, userId, userEmail);
      }
    }
  }, [currentAssetIndex, pendingAssets, approvedAssets, userId, userEmail]);

  const performUpload = useCallback(
    async (
      assets: DocumentPicker.DocumentPickerAsset[],
      userIdParam: number,
      userEmailParam: string,
    ) => {
      try {
        // Create a fake result object for saveMultipleFiles
        const fakeResult = {
          assets,
          canceled: false,
        };

        const { saved, failed } = await saveMultipleFiles(
          fakeResult as any,
          userIdParam,
          userEmailParam,
        );

        console.log(
          "Save result - Saved:",
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

      // Ensure user.id is a number
      const userIdNum =
        typeof user.id === "string" ? parseInt(user.id, 10) : user.id;
      console.log("Checking duplicates for user:", userIdNum, user.email);

      // Start duplicate check process
      await processDuplicateCheck(result.assets, userIdNum, user.email);
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

      {/* Duplicate File Confirmation Modal */}
      <Modal
        visible={showDuplicateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDuplicateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Duplicate File</Text>
            <Text style={styles.modalMessage}>
              File "{duplicateFile}" already exists. Do you want to upload it
              again?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleSkip}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.uploadButton]}
                onPress={handleUploadAgain}
              >
                <Text style={styles.uploadButtonText}>Upload Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginHorizontal: 32,
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Colors.backgroundAccent,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  uploadButton: {
    backgroundColor: Colors.primary,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textWhite,
  },
});
