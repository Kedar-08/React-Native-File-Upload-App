/**
 * Shared File Viewer Screen - View shared file details, download, and remove from inbox.
 */

import { ConfirmationModal, LoadingSpinner, Toast } from "@/components/ui";
import { Colors } from "@/constants/theme";
import {
  downloadAndOpenFile,
  formatFileSize,
  formatTimestamp,
  getFileIcon,
  getFriendlyFileLabel,
  getUserByUsername,
  markShareAsRead,
  removeFromInbox,
  type SharedFile,
} from "@/services";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SharedFileViewerScreen() {
  const params = useLocalSearchParams<{
    shareId: string;
    shareData?: string;
  }>();
  const [share, setShare] = useState<SharedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [senderEmail, setSenderEmail] = useState<string | null>(null);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  useEffect(() => {
    loadShare();
  }, [params.shareId]);

  async function loadShare() {
    try {
      // Parse share data from params
      if (params.shareData) {
        const shareData = JSON.parse(params.shareData as string) as SharedFile;
        setShare(shareData);

        // Mark as read if not already
        if (!shareData.isRead) {
          try {
            await markShareAsRead(shareData.id);
          } catch (error) {
            console.error("Failed to mark as read:", error);
          }
        }
        // Attempt to load sender email if available; otherwise lookup by username
        if ((shareData as any).fromEmail) {
          setSenderEmail((shareData as any).fromEmail);
        } else if (shareData.fromUsername) {
          try {
            const u = await getUserByUsername(shareData.fromUsername);
            if (u?.email) setSenderEmail(u.email);
          } catch (err) {
            // Ignore lookup errors
          }
        }
      } else {
        router.back();
        return;
      }
    } catch (error) {
      console.error("Failed to load shared file:", error);
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!share) return;

    setDownloading(true);
    try {
      await downloadAndOpenFile(share.file);
      setToast({
        visible: true,
        message: "File opened successfully",
        type: "success",
      });
    } catch (error: any) {
      console.error("Failed to download file:", error);
      setToast({
        visible: true,
        message: error.message || "Failed to open file",
        type: "error",
      });
    } finally {
      setDownloading(false);
    }
  }

  function handleDelete() {
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!share) return;

    setShowDeleteModal(false);
    setRemoving(true);
    try {
      await removeFromInbox(share.id);
      setToast({
        visible: true,
        message: "Removed from inbox",
        type: "success",
      });
      // Go back after removing
      setTimeout(() => router.back(), 500);
    } catch (error: any) {
      console.error("Failed to remove file:", error);
      setToast({
        visible: true,
        message: error.message || "Failed to remove file",
        type: "error",
      });
      setRemoving(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading shared file..." />;
  }

  if (!share) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Shared file not found</Text>
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
          title="Remove from Inbox"
          message={`Are you sure you want to remove "${share.file.fileName}" from your inbox? This action cannot be undone.`}
          confirmText="Remove"
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />

        <View style={styles.content}>
          {/* File Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={getFileIcon(share.file.fileType)}
              size={64}
              color={Colors.primary}
            />
          </View>

          {/* File Name */}
          <Text style={styles.fileName}>{share.file.fileName}</Text>

          {/* Shared Info Badge */}
          <View style={styles.sharedInfoBadge}>
            <Ionicons name="share-social" size={16} color={Colors.primary} />
            <Text style={styles.sharedInfoText}>
              Shared by {share.fromFullName || share.fromUsername}
            </Text>
          </View>

          {/* File Details */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>File Type</Text>
              <Text style={styles.detailValue}>
                {getFriendlyFileLabel(share.file.fileType, share.file.fileName)}
              </Text>
            </View>

            <View style={styles.divider} />

            {share.file.fileSize && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Size</Text>
                  <Text style={styles.detailValue}>
                    {formatFileSize(share.file.fileSize)}
                  </Text>
                </View>
                <View style={styles.divider} />
              </>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shared From</Text>
              <Text style={styles.detailValue}>
                {share.fromFullName || share.fromUsername}
              </Text>
              {senderEmail ? (
                <Text style={styles.detailSubValue}>{senderEmail}</Text>
              ) : null}
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shared Date</Text>
              <Text style={styles.detailValue}>
                {formatTimestamp(share.sharedAt)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: share.isRead
                        ? Colors.success
                        : Colors.warning,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: share.isRead ? Colors.success : Colors.warning },
                  ]}
                >
                  {share.isRead ? "Read" : "Unread"}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.compactButton, styles.primaryButton]}
              onPress={handleDownload}
              disabled={downloading || removing}
              activeOpacity={0.7}
            >
              {downloading ? (
                <ActivityIndicator color={Colors.textWhite} size="small" />
              ) : (
                <>
                  <Ionicons
                    name="download"
                    size={20}
                    color={Colors.textWhite}
                  />
                  <Text style={styles.compactButtonText}>Download</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.compactButton, styles.dangerButton]}
              onPress={handleDelete}
              disabled={downloading || removing}
              activeOpacity={0.7}
            >
              {removing ? (
                <ActivityIndicator color={Colors.textWhite} size="small" />
              ) : (
                <>
                  <Ionicons name="trash" size={20} color={Colors.textWhite} />
                  <Text style={styles.compactButtonText}>Remove</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  sharedInfoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
    gap: 6,
  },
  sharedInfoText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
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
  detailSubValue: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
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
  dangerButton: {
    backgroundColor: Colors.error,
  },
  compactButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textWhite,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
    marginTop: 40,
  },
});
