import { type FileMetadata, formatTimestamp } from "@/services";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface FileItemProps {
  file: FileMetadata;
  onPress: (file: FileMetadata) => void;
}

export function FileItem({ file, onPress }: FileItemProps) {
  const getFileIcon = (fileType: string): keyof typeof Ionicons.glyphMap => {
    if (fileType.startsWith("image/")) return "image-outline";
    if (fileType.startsWith("video/")) return "videocam-outline";
    if (fileType.startsWith("audio/")) return "musical-notes-outline";
    if (fileType.includes("pdf")) return "document-text-outline";
    if (fileType.includes("word") || fileType.includes("document"))
      return "document-outline";
    if (fileType.includes("sheet") || fileType.includes("excel"))
      return "grid-outline";
    if (fileType.includes("presentation") || fileType.includes("powerpoint"))
      return "easel-outline";
    if (
      fileType.includes("zip") ||
      fileType.includes("rar") ||
      fileType.includes("7z")
    )
      return "archive-outline";
    return "document-outline";
  };

  const getFileTypeLabel = (fileType: string): string => {
    const parts = fileType.split("/");
    if (parts.length > 1) {
      return parts[1].toUpperCase();
    }
    return fileType.toUpperCase();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(file)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={getFileIcon(file.fileType)} size={28} color="#007AFF" />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.fileName} numberOfLines={1}>
          {file.fileName}
        </Text>
        <Text style={styles.fileType}>{getFileTypeLabel(file.fileType)}</Text>
        <Text style={styles.metadata}>Uploaded by {file.uploadedByEmail}</Text>
        <Text style={styles.timestamp}>{formatTimestamp(file.timestamp)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#f0f7ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  fileType: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "500",
    marginBottom: 4,
  },
  metadata: {
    fontSize: 12,
    color: "#666",
  },
  timestamp: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
});
