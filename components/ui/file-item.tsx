import { Colors } from "@/constants/theme";
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
        <Ionicons
          name={getFileIcon(file.fileType)}
          size={28}
          color={Colors.primary}
        />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.fileName} numberOfLines={1}>
          {file.fileName}
        </Text>
        <Text style={styles.fileType}>{getFileTypeLabel(file.fileType)}</Text>
        <Text style={styles.metadata}>Uploaded by {file.uploadedByEmail}</Text>
        <Text style={styles.timestamp}>{formatTimestamp(file.timestamp)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.iconMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundWhite,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
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
  metadata: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
