/**
 * Signup Screen - Create new account with backend API.
 */

import { Button, InputField } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { signup, type SignupData } from "@/services";
import { router } from "expo-router";
import { Formik } from "formik";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Yup from "yup";

const signupSchema = Yup.object().shape({
  fullName: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .required("Full name is required"),
  username: Yup.string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .matches(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .required("Username is required"),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .required("Please confirm your password")
    .test("passwords-match", "Passwords must match", function (confirmPassword) {
      return (
        (confirmPassword || "").trim() === (this.parent.password || "").trim()
      );
    }),
});

interface SignupFormValues {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupScreen() {
  async function handleSignup(
    values: SignupFormValues,
    { setErrors }: any
  ) {
    try {
      const signupData: SignupData = {
        fullName: values.fullName.trim(),
        username: values.username.trim().toLowerCase(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      };

      const result = await signup(signupData);

      if (result.success) {
        router.replace("/(tabs)/dashboard");
      } else {
        // Map error to specific field
        if (result.field) {
          setErrors({ [result.field]: result.message });
        } else {
          setErrors({ email: result.message });
        }
      }
    } catch (error) {
      setErrors({ email: "An unexpected error occurred" });
    }
  }

  function goToLogin() {
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          <Formik
            initialValues={{
              fullName: "",
              username: "",
              email: "",
              password: "",
              confirmPassword: "",
            }}
            validationSchema={signupSchema}
            onSubmit={handleSignup}
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
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={values.fullName}
                  onChangeText={handleChange("fullName")}
                  onBlur={handleBlur("fullName")}
                  autoCapitalize="words"
                  autoCorrect={false}
                  error={
                    touched.fullName && errors.fullName
                      ? errors.fullName
                      : undefined
                  }
                />

                <InputField
                  label="Username"
                  placeholder="Choose a unique username"
                  value={values.username}
                  onChangeText={handleChange("username")}
                  onBlur={handleBlur("username")}
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={
                    touched.username && errors.username
                      ? errors.username
                      : undefined
                  }
                />

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
                  placeholder="Create a password (min 6 characters)"
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

                <InputField
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={values.confirmPassword}
                  onChangeText={handleChange("confirmPassword")}
                  onBlur={handleBlur("confirmPassword")}
                  secureTextEntry
                  error={
                    touched.confirmPassword && errors.confirmPassword
                      ? errors.confirmPassword
                      : undefined
                  }
                />

                <Button
                  title="Create Account"
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  style={styles.signupButton}
                />
              </View>
            )}
          </Formik>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={goToLogin}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
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
  signupButton: {
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
  loginLink: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
});
