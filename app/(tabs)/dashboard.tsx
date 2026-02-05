import { FileItem, LoadingSpinner, Toast } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { getAllFiles, isLoggedIn, type FileMetadata } from "@/services";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

export default function DashboardScreen() {
  const params = useLocalSearchParams();
  const lastUploadIdRef = useRef<string | null>(null);

  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  // Extract specific params to avoid dependency array issues
  const uploadDone = (params.uploadDone as string) || null;
  const savedCount = parseInt((params.savedCount as string) || "0", 10);
  const failedCount = parseInt((params.failedCount as string) || "0", 10);

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

  // Show toast / reload when upload completes and params are passed
  useEffect(() => {
    if (!uploadDone) return;

    // Prevent processing the same upload multiple times
    if (lastUploadIdRef.current === uploadDone) return;
    lastUploadIdRef.current = uploadDone;

    // Trigger reload
    loadFiles();

    if (savedCount > 0 && failedCount === 0) {
      setToast({
        visible: true,
        message:
          savedCount === 1
            ? "File uploaded successfully!"
            : `${savedCount} files uploaded successfully!`,
        type: "success",
      });
    } else if (savedCount > 0 && failedCount > 0) {
      setToast({
        visible: true,
        message: `${savedCount} file(s) uploaded. ${failedCount} failed.`,
        type: "success",
      });
    } else if (failedCount > 0) {
      setToast({
        visible: true,
        message: `Failed to upload ${failedCount} file(s).`,
        type: "error",
      });
    }
  }, [uploadDone, savedCount, failedCount]);

  async function checkAuthAndLoadData() {
    try {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        router.replace("/");
        return;
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

  function handleFilePress(file: FileMetadata) {
    router.push({
      pathname: "/file-viewer",
      params: { fileId: file.id.toString() },
    });
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
              Tap the Upload tab (+) to upload your first file
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
