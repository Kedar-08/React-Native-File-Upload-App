/**
 * Shared File Viewer Screen - View shared file details, download, and remove from inbox.
 */

import { LoadingSpinner, Toast } from "@/components/ui";
import { Colors } from "@/constants/theme";
import {
  downloadAndOpenFile,
  formatFileSize,
  formatTimestamp,
  getFileIcon,
  getFriendlyFileLabel,
  type FileMetadata,
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
    fileData?: string;
  }>();
  const [file, setFile] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [senderName, setSenderName] = useState<string | null>(null);
  const [senderEmail, setSenderEmail] = useState<string | null>(null);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  useEffect(() => {
    loadFile();
  }, [params.fileData]);

  async function loadFile() {
    try {
      // Parse file data from params
      if (params.fileData) {
        const fileData = JSON.parse(params.fileData as string) as FileMetadata;
        setFile(fileData);
        // Display sender's username
        setSenderName(fileData.uploadedByUsername || null);
      } else {
        router.back();
        return;
      }
    } catch (error) {
      console.error("Failed to load file:", error);
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!file) return;

    setDownloading(true);
    try {
      console.log("📥 [handleDownload] Downloading file:", file.fileName);
      await downloadAndOpenFile(file);
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

  if (loading) {
    return <LoadingSpinner message="Loading file..." />;
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

          {/* Shared Info Badge */}
          {senderName && (
            <View style={styles.sharedInfoBadge}>
              <Ionicons name="share-social" size={16} color={Colors.primary} />
              <Text style={styles.sharedInfoText}>Shared by {senderName}</Text>
            </View>
          )}

          {/* File Details */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>File Type</Text>
              <Text style={styles.detailValue}>
                {getFriendlyFileLabel(file.fileType, file.fileName)}
              </Text>
            </View>

            <View style={styles.divider} />

            {file.fileSize > 0 && (
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

            {senderName && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Shared By</Text>
                  <Text style={styles.detailValue}>{senderName}</Text>
                </View>
                <View style={styles.divider} />
              </>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {senderName === "You" ? "Uploaded" : "Shared"} Date
              </Text>
              <Text style={styles.detailValue}>
                {formatTimestamp(file.timestamp)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.compactButton, styles.primaryButton]}
              onPress={handleDownload}
              disabled={downloading}
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
                  <Text style={styles.compactButtonText}>Download & Open</Text>
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
