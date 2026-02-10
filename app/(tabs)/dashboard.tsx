/**
 * Dashboard Screen - My uploaded files from backend.
 */

import { FileItem, LoadingSpinner, Toast } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { getMyFiles, isLoggedIn } from "@/services";
import type { FileMetadata } from "@/services/file-service";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DashboardScreen() {
  const params = useLocalSearchParams();
  const lastUploadIdRef = useRef<string | null>(null);

  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  const filterOptions = [
    { key: "all", label: "All" },
    { key: "documents", label: "Documents" },
    { key: "images", label: "Images" },
    { key: "videos", label: "Videos" },
    { key: "audio", label: "Audio" },
    { key: "others", label: "Others" },
  ];

  function getFileType(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    const docs = [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
      "csv",
    ];
    const images = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
    const videos = ["mp4", "mkv", "avi", "mov", "webm"];
    const audio = ["mp3", "wav", "aac", "m4a", "ogg"];
    if (docs.includes(extension)) return "documents";
    if (images.includes(extension)) return "images";
    if (videos.includes(extension)) return "videos";
    if (audio.includes(extension)) return "audio";
    return "others";
  }

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
      const allFiles = await getMyFiles();
      // Sort by timestamp descending (newest first)
      const sorted = allFiles.sort(
        (a: FileMetadata, b: FileMetadata) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setFiles(sorted);
    } catch (error: any) {
      console.error("Failed to load files:", error);

      // If 401 Unauthorized, token may have expired - redirect to login
      if (error.status === 401) {
        console.warn(
          "🚫 Unauthorized - token may have expired, redirecting to login",
        );
        setToast({
          visible: true,
          message: "Session expired. Please log in again.",
          type: "error",
        });
        // Give user 2 seconds to see the message, then redirect
        setTimeout(() => {
          router.replace("/");
        }, 2000);
        return;
      }

      setToast({
        visible: true,
        message: error.message || "Failed to load files",
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

  const filteredFiles =
    selectedFilter === "all"
      ? files
      : files.filter(
          (file) => getFileType(file.fileName ?? "") === selectedFilter,
        );

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
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>
            Uploaded Files ({filteredFiles.length})
          </Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter" size={20} color={Colors.primary} />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {filteredFiles.length === 0 ? (
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
            data={filteredFiles}
            keyExtractor={(item) => String(item.id)}
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

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Type</Text>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterOption,
                  selectedFilter === option.key && styles.selectedFilterOption,
                ]}
                onPress={() => {
                  setSelectedFilter(option.key);
                  setShowFilterModal(false);
                }}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedFilter === option.key &&
                      styles.selectedFilterOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.backgroundCard,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedFilterOption: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  filterOptionText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  selectedFilterOptionText: {
    color: Colors.primaryDark,
    fontWeight: "700",
  },
});
