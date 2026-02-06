/**
 * Mock data for development/testing without backend.
 * Provides realistic test data that mirrors API response shapes.
 *
 * NOTE: In mock mode, downloadUrl points to real web URLs for testing.
 * When backend is ready, replace these with your API endpoints.
 */

// Sample PDF document (small test PDF from web)
const PDF_URL = "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table.pdf";

// Sample image (test image from web)
const IMAGE_URL = "https://www.w3schools.com/css/img_5terre.jpg";

// Sample Excel-like document representation (using a public CSV/XLS URL)
const SPREADSHEET_URL = "https://www.w3schools.com/css/img_5terre.jpg"; // Fallback to image for testing

export const mockAuthUser = {
  id: 1,
  email: "user@example.com",
  fullName: "John Doe",
  username: "johndoe",
  token: "mock-token-12345",
};

// Available test users for login/signup
export const mockTestUsers = [
  {
    id: 1,
    email: "testuser@gmail.com",
    password: "password",
    fullName: "Test User",
    username: "testuser",
    token: "mock-token-testuser-12345",
  },
  {
    id: 10,
    email: "user@example.com",
    password: "password",
    fullName: "John Doe",
    username: "johndoe",
    token: "mock-token-12345",
  },
];

export const mockUsers = [
  {
    id: 2,
    email: "alice@example.com",
    fullName: "Alice Johnson",
    username: "alice_j",
  },
  {
    id: 3,
    email: "bob@example.com",
    fullName: "Bob Smith",
    username: "bob_smith",
  },
  {
    id: 4,
    email: "carol@example.com",
    fullName: "Carol Williams",
    username: "carol_w",
  },
  {
    id: 5,
    email: "david@example.com",
    fullName: "David Brown",
    username: "david_b",
  },
];

export const mockFiles = [
  {
    id: 1,
    fileName: "presentation.pdf",
    fileType: "application/pdf",
    fileSize: 2048576,
    uploadedByUserId: 1,
    uploadedByUsername: "johndoe",
    uploadedByEmail: "user@example.com",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    downloadUrl: PDF_URL,
  },
  {
    id: 2,
    fileName: "report.xlsx",
    fileType: "application/vnd.ms-excel",
    fileSize: 512000,
    uploadedByUserId: 1,
    uploadedByUsername: "johndoe",
    uploadedByEmail: "user@example.com",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    downloadUrl: SPREADSHEET_URL,
  },
  {
    id: 3,
    fileName: "photo.jpg",
    fileType: "image/jpeg",
    fileSize: 3145728,
    uploadedByUserId: 1,
    uploadedByUsername: "johndoe",
    uploadedByEmail: "user@example.com",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    downloadUrl: IMAGE_URL,
  },
  {
    id: 4,
    fileName: "document.docx",
    fileType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileSize: 1024000,
    uploadedByUserId: 1,
    uploadedByUsername: "johndoe",
    uploadedByEmail: "user@example.com",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    downloadUrl: PDF_URL, // Fallback to PDF for testing
  },
];

export const mockSharedFiles = [
  {
    id: 1,
    fileId: 1,
    file: mockFiles[0],
    fromUserId: 2,
    fromUsername: "alice_j",
    fromFullName: "Alice Johnson",
    toUserId: 1,
    toUsername: "johndoe",
    sharedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: 2,
    fileId: 2,
    file: mockFiles[1],
    fromUserId: 3,
    fromUsername: "bob_smith",
    fromFullName: "Bob Smith",
    toUserId: 1,
    toUsername: "johndoe",
    sharedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 3,
    fileId: 3,
    file: mockFiles[2],
    fromUserId: 4,
    fromUsername: "carol_w",
    fromFullName: "Carol Williams",
    toUserId: 1,
    toUsername: "johndoe",
    sharedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isRead: false,
  },
];
