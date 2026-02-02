import { Button, LoadingSpinner } from "@/components/ui";
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
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

export default function FileViewerScreen() {
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const [file, setFile] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadFile();
  }, [fileId]);

  async function loadFile() {
    if (!fileId) {
      Alert.alert("Error", "File not found");
      router.back();
      return;
    }

    try {
      const fileData = await getFileById(parseInt(fileId));
      if (!fileData) {
        Alert.alert("Error", "File not found");
        router.back();
        return;
      }
      setFile(fileData);
    } catch (error) {
      console.error("Failed to load file:", error);
      Alert.alert("Error", "Failed to load file details");
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
      Alert.alert(
        "Error",
        "Failed to open file. The file may not exist or cannot be opened on this device.",
      );
    } finally {
      setOpening(false);
    }
  }

  async function handleDelete() {
    if (!file) return;

    Alert.alert(
      "Delete File",
      `Are you sure you want to delete "${file.fileName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteFile(file.id);
              Alert.alert("Success", "File deleted successfully", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error("Failed to delete file:", error);
              Alert.alert("Error", "Failed to delete file");
              setDeleting(false);
            }
          },
        },
      ],
    );
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
      <View style={styles.content}>
        {/* File Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={getFileIcon(file.fileType)}
            size={64}
            color="#007AFF"
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
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: "#f0f7ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  fileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 24,
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailRow: {
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
  },
  pathText: {
    fontSize: 12,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
  },
  actions: {
    width: "100%",
    marginTop: 24,
  },
  actionButton: {
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginTop: 40,
  },
});
