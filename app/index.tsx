import { Button, InputField, LoadingSpinner } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { isLoggedIn, login } from "@/services";
import { router } from "expo-router";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Yup from "yup";

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function LoginScreen() {
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      const loggedIn = await isLoggedIn();
      if (loggedIn) {
        router.replace("/dashboard");
      }
    } catch (error) {
      console.log("Auth check error:", error);
    } finally {
      setCheckingAuth(false);
    }
  }

  async function handleLogin(values: { email: string; password: string }) {
    try {
      const result = await login(values.email, values.password);

      if (result.success) {
        router.replace("/dashboard");
      } else {
        Alert.alert("Login Failed", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    }
  }

  function goToSignup() {
    router.push("/signup");
  }

  if (checkingAuth) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={loginSchema}
          onSubmit={handleLogin}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            isSubmitting,
          }) => (
            <View style={styles.form}>
              <InputField
                label="Email"
                placeholder="Enter your email"
                value={values.email}
                onChangeText={handleChange("email")}
                onBlur={handleBlur("email")}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={touched.email && errors.email ? errors.email : undefined}
              />

              <InputField
                label="Password"
                placeholder="Enter your password"
                value={values.password}
                onChangeText={handleChange("password")}
                onBlur={handleBlur("password")}
                secureTextEntry
                error={
                  touched.password && errors.password
                    ? errors.password
                    : undefined
                }
              />

              <Button
                title="Sign In"
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.loginButton}
              />
            </View>
          )}
        </Formik>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={goToSignup}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  form: {
    backgroundColor: Colors.backgroundWhite,
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  loginButton: {
    marginTop: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  linkText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "700",
  },
});
