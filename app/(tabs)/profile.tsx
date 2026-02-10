/**
 * Profile Screen - Display user info from backend.
 */

import { Toast } from "@/components/ui";
import { Colors } from "@/constants/theme";
import {
  formatTimestamp,
  getLoggedInUser,
  logout,
  refreshUserProfile,
  type StoredUserProfile,
} from "@/services";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const [user, setUser] = useState<StoredUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, []),
  );

  async function loadUserData() {
    try {
      // First try local storage
      let userData = await getLoggedInUser();
      console.log("👤 Local stored user:", JSON.stringify(userData, null, 2));

      // If we have a token, try refreshing from backend
      if (userData) {
        try {
          const refreshed = await refreshUserProfile();
          console.log(
            "🔄 Backend refreshed user:",
            JSON.stringify(refreshed, null, 2),
          );
          if (refreshed) {
            userData = refreshed;
          }
        } catch (refreshError) {
          console.warn(
            "⚠️ Failed to refresh from backend, using local:",
            refreshError,
          );
          // Continue with local user data if refresh fails
        }
      }

      if (!userData) {
        throw new Error("No user data available");
      }

      console.log(
        "✅ Final user data to display:",
        JSON.stringify(userData, null, 2),
      );
      setUser(userData);
    } catch (error: any) {
      console.error("❌ Failed to load user data:", error);
      setToast({
        visible: true,
        message: error.message || "Failed to load profile",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const refreshed = await refreshUserProfile();
      if (refreshed) {
        setUser(refreshed);
        setToast({
          visible: true,
          message: "Profile refreshed",
          type: "success",
        });
      }
    } catch (error: any) {
      console.error("Refresh failed:", error);
      setToast({
        visible: true,
        message: error.message || "Failed to refresh profile",
        type: "error",
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      // Logout is best-effort - backend API failure doesn't block UI logout
      console.log("👤 [handleLogout] Starting logout...");
      await logout();
      console.log("✅ [handleLogout] Logout complete - navigating to login");
      // Navigate to login screen - logout() always clears auth data
      router.replace("/");
    } catch (error) {
      // logout() never throws, but catch for safety
      console.error("❌ [handleLogout] Unexpected error:", error);
      setLoggingOut(false);
      setToast({
        visible: true,
        message: "Logout failed - please try again",
        type: "error",
      });
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="person-circle" size={64} color={Colors.iconMuted} />
          <Text style={styles.loadingText}>Unable to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
        />
      }
    >
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
            <Ionicons name="person-circle" size={80} color={Colors.primary} />
          </View>
          {user.fullName && (
            <Text style={styles.fullName}>{user.fullName}</Text>
          )}
          {user.username && (
            <Text style={styles.username}>@{user.username}</Text>
          )}
        </View>

        {/* User Info */}
        <View style={styles.infoSection}>
          {/* Full Name */}
          {user.fullName && (
            <View style={styles.infoRow}>
              <Ionicons
                name="person-outline"
                size={20}
                color={Colors.primary}
                style={styles.infoIcon}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{user.fullName}</Text>
              </View>
            </View>
          )}

          {/* Username */}
          {user.username && (
            <View style={styles.infoRow}>
              <Ionicons
                name="at-outline"
                size={20}
                color={Colors.primary}
                style={styles.infoIcon}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>@{user.username}</Text>
              </View>
            </View>
          )}

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
          {user.createdAt && (
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
                  {formatTimestamp(user.createdAt)}
                </Text>
              </View>
            </View>
          )}
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
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.textWhite,
    fontWeight: "600",
    fontSize: 14,
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
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  avatar: {
    marginBottom: 12,
  },
  fullName: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  infoSection: {
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  actionSection: {
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.error,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    width: "30%",
    alignSelf: "center",
  },
  logoutButtonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: "700",
  },
  footerSection: {
    alignItems: "center",
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
