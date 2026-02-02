import { Colors } from "@/constants/theme";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
