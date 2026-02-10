/**
 * File Viewer Screen - View file details, share with users, open/delete.
 */

import {
  Button,
  ConfirmationModal,
  LoadingSpinner,
  Toast,
} from "@/components/ui";
import { Colors } from "@/constants/theme";
import {
  deleteFile,
  formatFileSize,
  formatTimestamp,
  getFileDetailsById,
  getFileIcon,
  getFriendlyFileLabel,
  getLoggedInUser,
  getUsers,
  openMyFile,
  shareFile,
  type FileMetadata,
  type User,
} from "@/services";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function FileViewerScreen() {
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const [file, setFile] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sharing, setSharing] = useState(false);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadFile();
    loadCurrentUser();
  }, [fileId]);

  async function loadCurrentUser() {
    const user = await getLoggedInUser();
    if (user?.id) {
      setCurrentUserId(user.id);
    }
  }

  async function loadFile() {
    if (!fileId) {
      router.back();
      return;
    }

    try {
      let fileData: FileMetadata | null = null;

      // All files now use UUID format
      if (typeof fileId === "string") {
        fileData = await getFileDetailsById(fileId);
      }

      if (!fileData) {
        console.warn("File not found with ID:", fileId);
        router.back();
        return;
      }
      setFile(fileData);
    } catch (error: any) {
      console.error("Failed to load file:", error);

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
        setTimeout(() => {
          router.replace("/");
        }, 2000);
        return;
      }

      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen() {
    if (!file) return;

    setOpening(true);
    try {
      await openMyFile(file);
    } catch (error: any) {
      console.error("Failed to open file:", error);
      setToast({
        visible: true,
        message: error.message || "Failed to open file",
        type: "error",
      });
    } finally {
      setOpening(false);
    }
  }

  function handleDelete() {
    if (!file) return;
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!file) return;
    setShowDeleteModal(false);
    setDeleting(true);
    try {
      await deleteFile(file.id);
      router.back();
    } catch (error: any) {
      // Detect 404 Not Found coming from backend (delete API not implemented)
      const status =
        error?.status ||
        error?.original?.status ||
        error?.original?.response?.status ||
        error?.code?.includes("404")
          ? 404
          : null;

      if (status === 404 || error?.message?.includes("404")) {
        console.log("🚫 [confirmDelete] Delete API not yet implemented (404)");
        setToast({
          visible: true,
          message: "Delete not available — backend API not yet implemented",
          type: "error",
        });
        setDeleting(false);
        return;
      }

      console.error("❌ [confirmDelete] Failed to delete file:", error);
      setToast({
        visible: true,
        message: error.message || "Failed to delete file",
        type: "error",
      });
      setDeleting(false);
    }
  }

  function handleSharePress() {
    setShowShareModal(true);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    setSelectedUser(null);

    if (query.trim().length < 2) {
      console.log("🔍 Query too short:", query.length, "chars");
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      console.log("🔍 [handleSearch] Searching for users:", query);
      console.log("🔍 [handleSearch] currentUserId:", currentUserId);

      // Load all users and filter client-side
      const result = await getUsers();
      console.log("🔍 [handleSearch] getUsers() returned:", result);

      const allUsers = result.users || [];
      console.log("🔍 [handleSearch] allUsers count:", allUsers.length);
      console.log("🔍 [handleSearch] allUsers sample:", allUsers.slice(0, 3));

      // Filter by matching username or fullName, exclude current user
      const queryLower = query.trim().toLowerCase();
      const filtered = allUsers.filter((u) => {
        const isNotCurrent = u.id !== currentUserId;
        const usernameMatch = u.username?.toLowerCase().includes(queryLower);
        const fullNameMatch = u.fullName?.toLowerCase().includes(queryLower);
        const match = isNotCurrent && (usernameMatch || fullNameMatch);
        if (match) {
          console.log(
            "  ✓ Match:",
            u.username,
            "- username:",
            usernameMatch,
            "fullName:",
            fullNameMatch,
          );
        }
        return match;
      });

      console.log("✅ [handleSearch] Filtered count:", filtered.length);
      console.log("✅ [handleSearch] Setting search results:", filtered);
      setSearchResults(filtered);
    } catch (error) {
      console.error("❌ [handleSearch] Search failed:", error);
      setToast({
        visible: true,
        message: "Failed to load users",
        type: "error",
      });
    } finally {
      setSearching(false);
    }
  }

  function handleSelectUser(user: User) {
    setSelectedUser(user);
    setSearchQuery(user.username);
    setSearchResults([]);
  }

  async function handleShareFile() {
    if (!file || !selectedUser) return;

    setSharing(true);
    try {
      const result = await shareFile({
        fileId: file.id,
        receiverId: selectedUser.id,
      });

      if (result.success) {
        setToast({
          visible: true,
          message: `File shared with ${selectedUser.fullName || selectedUser.username}`,
          type: "success",
        });
        closeShareModal();
      } else {
        setToast({
          visible: true,
          message: result.error || "Failed to share file",
          type: "error",
        });
      }
    } catch (error: any) {
      setToast({
        visible: true,
        message: error.message || "Failed to share file",
        type: "error",
      });
    } finally {
      setSharing(false);
    }
  }

  function closeShareModal() {
    if (!sharing) {
      setShowShareModal(false);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUser(null);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading file details..." />;
  }

  if (!file) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>File not found</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast({ ...toast, visible: false })}
        />

        <ConfirmationModal
          visible={showDeleteModal}
          title="Delete File"
          message={`Are you sure you want to delete "${file.fileName}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />

        <View style={styles.content}>
          {/* File Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={getFileIcon(file.fileType)}
              size={64}
              color={Colors.primary}
            />
          </View>

          {/* File Name */}
          <Text style={styles.fileName}>{file.fileName}</Text>

          {/* File Details */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>File Type</Text>
              <Text style={styles.detailValue}>
                {getFriendlyFileLabel(file.fileType, file.fileName)}
              </Text>
            </View>

            <View style={styles.divider} />

            {file.fileSize && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Size</Text>
                  <Text style={styles.detailValue}>
                    {formatFileSize(file.fileSize)}
                  </Text>
                </View>
                <View style={styles.divider} />
              </>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Uploaded By</Text>
              <Text style={styles.detailValue}>
                {file.uploadedByUsername || file.uploadedByEmail || "You"}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Upload Date</Text>
              <Text style={styles.detailValue}>
                {formatTimestamp(file.timestamp)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.compactButton, styles.primaryButton]}
              onPress={handleOpen}
              disabled={opening || deleting || sharing}
              activeOpacity={0.7}
            >
              {opening ? (
                <ActivityIndicator color={Colors.textWhite} size="small" />
              ) : (
                <>
                  <Ionicons name="open" size={20} color={Colors.textWhite} />
                  <Text style={styles.compactButtonText}>Open</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.compactButton, styles.secondaryButton]}
              onPress={handleSharePress}
              disabled={opening || deleting || sharing}
              activeOpacity={0.7}
            >
              <Ionicons name="share-social" size={20} color={Colors.primary} />
              <Text style={styles.compactButtonTextSecondary}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.compactButton, styles.dangerButton]}
              onPress={handleDelete}
              disabled={opening || deleting || sharing}
              activeOpacity={0.7}
            >
              {deleting ? (
                <ActivityIndicator color={Colors.textWhite} size="small" />
              ) : (
                <>
                  <Ionicons name="trash" size={20} color={Colors.textWhite} />
                  <Text style={styles.compactButtonText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Share File Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeShareModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share File</Text>
              <TouchableOpacity
                onPress={closeShareModal}
                disabled={sharing}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Search for a user</Text>

              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color={Colors.textMuted}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by username or name..."
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!sharing}
                />
                {searching && (
                  <ActivityIndicator
                    color={Colors.primary}
                    size="small"
                    style={styles.searchSpinner}
                  />
                )}
              </View>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item) =>
                      item.username ?? item.email ?? item.id.toString()
                    }
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.userItem}
                        onPress={() => handleSelectUser(item)}
                      >
                        <View style={styles.userAvatar}>
                          <Ionicons
                            name="person-circle"
                            size={40}
                            color={Colors.primary}
                          />
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.userFullName}>
                            {item.fullName}
                          </Text>
                          <Text style={styles.userUsername}>
                            @{item.username}
                          </Text>
                          {item.email ? (
                            <Text style={styles.userEmail}>{item.email}</Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    )}
                    style={styles.resultsList}
                  />
                </View>
              )}

              {/* Selected User */}
              {selectedUser && (
                <View style={styles.selectedUser}>
                  <Text style={styles.selectedLabel}>Share with:</Text>
                  <View style={styles.selectedUserInfo}>
                    <Ionicons
                      name="person-circle"
                      size={32}
                      color={Colors.primary}
                    />
                    <View style={styles.selectedUserText}>
                      <Text style={styles.selectedUserName}>
                        {selectedUser.fullName}
                      </Text>
                      <Text style={styles.selectedUserUsername}>
                        @{selectedUser.username}
                      </Text>
                      {selectedUser.email ? (
                        <Text style={styles.selectedUserEmail}>
                          {selectedUser.email}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedUser(null);
                        setSearchQuery("");
                      }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={24}
                        color={Colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {sharing && (
                <View style={styles.sharingContainer}>
                  <ActivityIndicator color={Colors.primary} size="small" />
                  <Text style={styles.sharingText}>Sharing file...</Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                onPress={closeShareModal}
                variant="secondary"
                disabled={sharing}
                style={styles.cancelButton}
              />
              <Button
                title="Share"
                onPress={handleShareFile}
                disabled={!selectedUser || sharing}
                loading={sharing}
                style={styles.shareButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  fileName: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 28,
    letterSpacing: -0.3,
  },
  detailsCard: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  detailRow: {
    paddingVertical: 14,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  actions: {
    width: "100%",
    marginTop: 28,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  compactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.backgroundAccent,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  dangerButton: {
    backgroundColor: Colors.error,
  },
  compactButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textWhite,
  },
  compactButtonTextSecondary: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    paddingTop: 60,
  },
  modalContent: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 24,
    marginHorizontal: 16,
    paddingBottom: 0,
    maxHeight: "85%",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    maxHeight: "70%",
    flexGrow: 1,
  },
  modalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundAccent,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  searchSpinner: {
    marginLeft: 8,
  },
  searchResults: {
    maxHeight: 200,
    marginTop: 12,
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  resultsList: {
    maxHeight: 400,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  userAvatar: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userFullName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  userUsername: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  selectedUser: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
  },
  selectedLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: "500",
  },
  selectedUserInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedUserText: {
    flex: 1,
    marginLeft: 8,
  },
  selectedUserName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  selectedUserUsername: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  selectedUserEmail: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sharingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    padding: 12,
  },
  sharingText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  cancelButton: {
    flex: 1,
  },
  shareButton: {
    flex: 1,
  },
});
