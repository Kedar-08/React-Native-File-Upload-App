import { Colors } from "@/constants/theme";
import {
  formatTimestamp,
  getFileIcon,
  getFriendlyFileLabel,
  type FileMetadata,
} from "@/services";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface FileItemProps {
  file: FileMetadata;
  onPress: (file: FileMetadata) => void;
}

export function FileItem({ file, onPress }: FileItemProps) {
  // Use shared friendly label helper
  const getFileTypeLabel = (fileType: string, fileName?: string): string =>
    getFriendlyFileLabel(fileType, fileName);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(file)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={getFileIcon(file.fileType, "outline")}
          size={28}
          color={Colors.primary}
        />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.fileName} numberOfLines={1}>
          {file.fileName}
        </Text>
        <Text style={styles.fileType}>
          {getFileTypeLabel(file.fileType, file.fileName)}
        </Text>
        <Text style={styles.metadata}>
          Uploaded by {file.uploadedByUsername || file.uploadedByEmail || "You"}
        </Text>
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
