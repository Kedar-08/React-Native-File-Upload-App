/**
 * Login Screen - Sign in with backend API.
 */

import { Button, InputField, LoadingSpinner } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { isLoggedIn, login, type LoginData } from "@/services";
import { router } from "expo-router";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import {
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
        router.replace("/(tabs)/dashboard");
      }
    } catch (error) {
      console.log("Auth check error:", error);
    } finally {
      setCheckingAuth(false);
    }
  }

  async function handleLogin(
    values: { email: string; password: string },
    { setErrors }: any
  ) {
    try {
      const loginData: LoginData = {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      };

      const result = await login(loginData);

      if (result.success) {
        router.replace("/(tabs)/dashboard");
      } else {
        if (result.field === "email") {
          setErrors({ email: result.message });
        } else if (result.field === "password") {
          setErrors({ password: result.message });
        } else {
          setErrors({ password: result.message || "Invalid credentials" });
        }
      }
    } catch (error) {
      setErrors({ password: "An unexpected error occurred" });
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
                error={
                  touched.email && errors.email ? errors.email : undefined
                }
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
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={goToSignup}>
            <Text style={styles.signupLink}>Sign Up</Text>
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
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  form: {
    gap: 16,
  },
  loginButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
});
