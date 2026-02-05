import { Text, View } from "react-native";

// This screen is not meant to be rendered - the Upload tab button
// in the tabs navigation handles file picking via listener.
// This file exists only to satisfy the route structure.

export default function UploadScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Text>Upload</Text>
    </View>
  );
}
