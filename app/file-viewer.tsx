import {
  Button,
  ConfirmationModal,
  InputField,
  LoadingSpinner,
  Toast,
} from "@/components/ui";
import { Colors } from "@/constants/theme";
import {
  deleteFile,
  formatTimestamp,
  getFileById,
  getFileIcon,
  openFile,
  validateIndianMobileNumber,
  type FileMetadata,
} from "@/services";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function FileViewerScreen() {
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const [file, setFile] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileError, setMobileError] = useState("");
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

  function handleSendPress() {
    setShowSendModal(true);
    setMobileNumber("");
    setMobileError("");
  }

  async function handleSendFile() {
    const validation = validateIndianMobileNumber(mobileNumber);
    if (!validation.valid) {
      setMobileError(validation.error);
      return;
    }

    setSending(true);
    try {
      // Simulate sending with a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Show success message
      setToast({
        visible: true,
        message: `File sent successfully to ${mobileNumber}`,
        type: "success",
      });

      // Close modal and reset
      setShowSendModal(false);
      setMobileNumber("");
      setMobileError("");
    } catch (error) {
      console.error("Failed to send file:", error);
      setToast({
        visible: true,
        message: "Failed to send file",
        type: "error",
      });
    } finally {
      setSending(false);
    }
  }

  function closeSendModal() {
    if (!sending) {
      setShowSendModal(false);
      setMobileNumber("");
      setMobileError("");
    }
  }

  // Compute validation once to avoid multiple calls in render
  const isNumberValid = validateIndianMobileNumber(mobileNumber).valid;

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
              disabled={opening || deleting || sending}
              style={styles.actionButton}
            />

            <Button
              title="Send File"
              onPress={handleSendPress}
              disabled={opening || deleting || sending}
              style={styles.actionButton}
            />

            <Button
              title={deleting ? "Deleting..." : "Delete File"}
              onPress={handleDelete}
              variant="danger"
              loading={deleting}
              disabled={opening || deleting || sending}
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>

      {/* Send File Modal */}
      <Modal
        visible={showSendModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSendModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send File</Text>
              <TouchableOpacity
                onPress={closeSendModal}
                disabled={sending}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>
                Enter the recipient's Indian mobile number
              </Text>

              <InputField
                label="Mobile Number"
                placeholder="Enter 10-digit number (e.g., 9876543210)"
                value={mobileNumber}
                onChangeText={(text) => {
                  setMobileNumber(text);
                  const validation = validateIndianMobileNumber(text);
                  setMobileError(
                    !validation.valid && text.length > 0
                      ? validation.error
                      : "",
                  );
                }}
                keyboardType="phone-pad"
                editable={!sending}
                maxLength={10}
                error={mobileError}
              />

              {sending && (
                <View style={styles.sendingContainer}>
                  <LoadingSpinner message="Sending file..." />
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                onPress={closeSendModal}
                variant="secondary"
                disabled={sending}
                style={styles.cancelButton}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!isNumberValid || sending) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendFile}
                disabled={!isNumberValid || sending}
              >
                {sending ? (
                  <ActivityIndicator color={Colors.textWhite} size="small" />
                ) : (
                  <Ionicons name="send" size={20} color={Colors.textWhite} />
                )}
              </TouchableOpacity>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.backgroundWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: "80%",
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
    paddingVertical: 24,
  },
  modalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    fontWeight: "500",
  },
  sendingContainer: {
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  cancelButton: {
    flex: 1,
  },
  sendButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.5,
  },
});
