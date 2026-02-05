// This route exists only to satisfy the Expo Router structure.
// The Upload tab's `tabPress` listener in the tabs layout intercepts
// the press and performs the file-picking flow, so this screen
// should never render UI. Returning null prevents any accidental UI.
export default function UploadScreen() {
  return null;
}
