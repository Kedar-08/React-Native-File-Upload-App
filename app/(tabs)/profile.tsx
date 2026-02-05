import { Toast } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { getLoggedInUser, logout } from "@/services";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface User {
  id: number;
  email: string;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const userData = await getLoggedInUser();
      setUser(userData as User);
    } catch (error) {
      console.error("Failed to load user data:", error);
      const anyErr = error as any;
      let errorMsg = "Failed to load profile";
      if (anyErr?.code === "AUTH_ERROR" || !anyErr?.code) {
        errorMsg = "Session expired. Please login again.";
      }
      setToast({
        visible: true,
        message: errorMsg,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
      setToast({
        visible: true,
        message: "Failed to logout",
        type: "error",
      });
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Unable to load profile</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />

      {/* Profile Card */}
      <View style={styles.card}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person-circle" size={64} color={Colors.primary} />
          </View>
        </View>

        {/* User Info */}
        <View style={styles.infoSection}>
          {/* Email */}
          <View style={styles.infoRow}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={Colors.primary}
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>

          {/* Member Since */}
          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={Colors.primary}
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {new Date().toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.7}
        >
          {loggingOut ? (
            <ActivityIndicator color={Colors.textWhite} size="small" />
          ) : (
            <>
              <Ionicons name="log-out" size={20} color={Colors.textWhite} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Additional Info */}
      <View style={styles.footerSection}>
        <Text style={styles.footerText}>App Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  card: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.backgroundAccent,
    justifyContent: "center",
    alignItems: "center",
  },
  infoSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  infoIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  actionSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.error,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    alignSelf: "center",
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textWhite,
  },
  footerSection: {
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500",
  },
});
