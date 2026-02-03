import {
  Button,
  ConfirmationModal,
  LoadingSpinner,
  Toast,
} from "@/components/ui";
import { Colors } from "@/constants/theme";
import {
  deleteFile,
  formatTimestamp,
  getFileById,
  openFile,
  type FileMetadata,
} from "@/services";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function FileViewerScreen() {
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const [file, setFile] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadFile();
  }, [fileId]);

  async function loadFile() {
    if (!fileId) {
      router.back();
      return;
    }

    try {
      const fileData = await getFileById(parseInt(fileId));
      if (!fileData) {
        router.back();
        return;
      }
      setFile(fileData);
    } catch (error) {
      console.error("Failed to load file:", error);
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen() {
    if (!file) return;

    setOpening(true);
    try {
      await openFile(file);
    } catch (error) {
      console.error("Failed to open file:", error);
      setToast({
        visible: true,
        message: "Failed to open file. It may not exist or cannot be opened.",
        type: "error",
      });
    } finally {
      setOpening(false);
    }
  }

  async function handleDelete() {
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
    } catch (error) {
      console.error("Failed to delete file:", error);
      setToast({
        visible: true,
        message: "Failed to delete file",
        type: "error",
      });
      setDeleting(false);
    }
  }

  function getFileIcon(fileType: string): keyof typeof Ionicons.glyphMap {
    if (fileType.startsWith("image/")) return "image";
    if (fileType.startsWith("video/")) return "videocam";
    if (fileType.startsWith("audio/")) return "musical-notes";
    if (fileType.includes("pdf")) return "document-text";
    if (fileType.includes("word") || fileType.includes("document"))
      return "document";
    if (fileType.includes("sheet") || fileType.includes("excel")) return "grid";
    if (fileType.includes("presentation") || fileType.includes("powerpoint"))
      return "easel";
    if (
      fileType.includes("zip") ||
      fileType.includes("rar") ||
      fileType.includes("7z")
    )
      return "archive";
    return "document";
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
            <Text style={styles.detailValue}>{file.fileType}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Uploaded By</Text>
            <Text style={styles.detailValue}>{file.uploadedByEmail}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Upload Date</Text>
            <Text style={styles.detailValue}>
              {formatTimestamp(file.timestamp)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Local Path</Text>
            <Text
              style={[styles.detailValue, styles.pathText]}
              numberOfLines={2}
            >
              {file.localFilePath}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title={opening ? "Opening..." : "Open File"}
            onPress={handleOpen}
            loading={opening}
            disabled={opening || deleting}
            style={styles.actionButton}
          />

          <Button
            title={deleting ? "Deleting..." : "Delete File"}
            onPress={handleDelete}
            variant="danger"
            loading={deleting}
            disabled={opening || deleting}
            style={styles.actionButton}
          />
        </View>
      </View>
    </ScrollView>
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
  pathText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "monospace",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  actions: {
    width: "100%",
    marginTop: 28,
  },
  actionButton: {
    marginBottom: 14,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
    marginTop: 40,
  },
});
