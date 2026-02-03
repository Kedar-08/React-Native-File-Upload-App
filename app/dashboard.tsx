import {
  Button,
  ConfirmationModal,
  FileItem,
  LoadingSpinner,
  Toast,
} from "@/components/ui";
import { Colors } from "@/constants/theme";
import {
  getAllFiles,
  getLoggedInUser,
  isLoggedIn,
  logout,
  pickFile,
  saveFile,
  type FileMetadata,
} from "@/services";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DashboardScreen() {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Check auth and load files on mount
  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  // Reload files when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFiles();
    }, []),
  );

  async function checkAuthAndLoadData() {
    try {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        router.replace("/");
        return;
      }

      const user = await getLoggedInUser();
      if (user) {
        setUserEmail(user.email);
      }

      await loadFiles();
    } catch (error) {
      console.error("Auth check error:", error);
      router.replace("/");
    }
  }

  async function loadFiles() {
    try {
      const allFiles = await getAllFiles();
      setFiles(allFiles);
    } catch (error) {
      console.error("Failed to load files:", error);
      setToast({
        visible: true,
        message: "Failed to load files",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  }

  async function handleUpload() {
    setUploading(true);
    try {
      const user = await getLoggedInUser();
      if (!user) {
        setToast({
          visible: true,
          message: "Please login again",
          type: "error",
        });
        setTimeout(() => router.replace("/"), 2000);
        return;
      }

      const result = await pickFile();

      if (result.canceled) {
        return;
      }

      // Save the file
      await saveFile(result, user.id, user.email);

      // Reload files list
      await loadFiles();

      setToast({
        visible: true,
        message: "File uploaded successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Upload error:", error);
      setToast({
        visible: true,
        message: "Failed to upload file",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  }

  function handleFilePress(file: FileMetadata) {
    router.push({
      pathname: "/file-viewer",
      params: { fileId: file.id.toString() },
    });
  }

  async function handleLogout() {
    setShowLogoutModal(true);
  }

  async function confirmLogout() {
    setShowLogoutModal(false);
    await logout();
    router.replace("/");
  }

  if (loading) {
    return <LoadingSpinner message="Loading files..." />;
  }

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />

      <ConfirmationModal
        visible={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout? You'll need to sign in again to access your files."
        confirmText="Logout"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>{userEmail}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color={Colors.textWhite} />
        </TouchableOpacity>
      </View>

      {/* Upload Button */}
      <View style={styles.uploadSection}>
        <Button
          title={uploading ? "Uploading..." : "Upload File"}
          onPress={handleUpload}
          loading={uploading}
          disabled={uploading}
        />
      </View>

      {/* Files List */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Uploaded Files ({files.length})</Text>

        {files.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="cloud-upload-outline"
              size={64}
              color={Colors.iconMuted}
            />
            <Text style={styles.emptyText}>No files uploaded yet</Text>
            <Text style={styles.emptySubtext}>
              Tap "Upload File" to get started
            </Text>
          </View>
        ) : (
          <FlatList
            data={files}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <FileItem file={item} onPress={handleFilePress} />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textWhite,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.primaryLight,
    marginTop: 4,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
  },
  uploadSection: {
    padding: 20,
    backgroundColor: Colors.backgroundWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: "center",
  },
});
