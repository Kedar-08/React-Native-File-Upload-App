/**
 * Inbox Screen - Files shared with the current user.
 */

import { LoadingSpinner, Toast } from "@/components/ui";
import { Colors } from "@/constants/theme";
import {
  formatTimestamp,
  getFileIcon,
  getFriendlyFileLabel,
  getSharedWithMe,
  isLoggedIn,
  type SharedFile,
} from "@/services";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function InboxScreen() {
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const filterOptions = [
    { key: "all", label: "All" },
    { key: "documents", label: "Documents" },
    { key: "images", label: "Images" },
    { key: "videos", label: "Videos" },
    { key: "audio", label: "Audio" },
    { key: "others", label: "Others" },
  ];

  // Load shared files when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkAuthAndLoad();
    }, []),
  );

  async function checkAuthAndLoad() {
    try {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        router.replace("/");
        return;
      }
      await loadSharedFiles();
    } catch (error) {
      console.error("Auth check error:", error);
      router.replace("/");
    }
  }

  async function loadSharedFiles() {
    try {
      const files = await getSharedWithMe();
      // Sort by sharedAt descending (newest first)
      const sorted = files.sort(
        (a, b) =>
          new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime(),
      );
      setSharedFiles(sorted);
    } catch (error: any) {
      console.error("Failed to load shared files:", error);
      setToast({
        visible: true,
        message: error.message || "Failed to load inbox",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

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

  const filteredSharedFiles =
    selectedFilter === "all"
      ? sharedFiles
      : sharedFiles.filter(
          (s) => getFileType(s.file.fileName ?? "") === selectedFilter,
        );

  async function handleRefresh() {
    setRefreshing(true);
    await loadSharedFiles();
    setRefreshing(false);
  }

  async function handleOpenFile(share: SharedFile) {
    // Navigate to shared file viewer
    router.push({
      pathname: "/shared-file-viewer",
      params: {
        shareId: share.id.toString(),
        shareData: JSON.stringify(share),
      },
    });
  }

  function renderSharedFileItem({ item }: { item: SharedFile }) {
    return (
      <TouchableOpacity
        style={[styles.fileItem, !item.isRead && styles.unreadItem]}
        onPress={() => handleOpenFile(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={getFileIcon(item.file.fileType, "outline")}
            size={28}
            color={Colors.primary}
          />
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.file.fileName}
          </Text>
          <Text style={styles.fileType}>
            {getFriendlyFileLabel(item.file.fileType, item.file.fileName)}
          </Text>
          <Text style={styles.senderInfo}>
            From: {item.fromFullName || item.fromUsername}
          </Text>
          <Text style={styles.timestamp}>{formatTimestamp(item.sharedAt)}</Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={24}
          color={Colors.textMuted}
          style={styles.chevron}
        />
      </TouchableOpacity>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading inbox..." />;
  }

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />

      <View style={styles.header}>
        <Text style={styles.sectionTitle}>
          Shared With Me ({filteredSharedFiles.length})
        </Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={20} color={Colors.primary} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {filteredSharedFiles.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="mail-open-outline"
            size={64}
            color={Colors.iconMuted}
          />
          <Text style={styles.emptyText}>No files shared with you</Text>
          <Text style={styles.emptySubtext}>
            Files shared by other users will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSharedFiles}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSharedFileItem}
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
  listContent: {
    paddingBottom: 24,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundWhite,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  unreadItem: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.backgroundWhite,
  },
  infoContainer: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  fileType: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    overflow: "hidden",
  },
  senderInfo: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    marginLeft: 12,
    opacity: 0.5,
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
