import {
  getRequestLogs,
  getStudentDocuments,
  getStudentRequests,
  submitDocumentRequest,
} from "./apiClient/documentApi.js";
import { logout as apiLogout } from "./apiClient/authApi.js";

document.addEventListener("DOMContentLoaded", async () => {
  // --- Auth guard: requires STUDENT role ---
  requireRole(["STUDENT"]);

  // --- Element references ---
  const firstNameEl = document.getElementById("navbar-firstname");
  const firstNameMobileEl = document.getElementById("navbar-firstname-mobile");
  const logoutBtn = document.getElementById("logout-btn");
  const logoutBtnMobile = document.getElementById("logout-btn-mobile");
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const cancelBtn = document.getElementById("cancel-btn");

  const sections = ['dashboard', 'request-document', 'my-requests'];

  // --- Helpers ---
  const getFirstName = () => {
      const email = sessionStorage.getItem("email") ?? "";
      return email.split("@")[0] ?? "Student";
  };

  const logout = async () => {
      try {
        const token = sessionStorage.getItem("ntc_access_token");
        const refreshToken = localStorage.getItem("ntc_refresh_token");
        if (token && refreshToken) {
          await apiLogout(refreshToken, token);
        }
      } catch (err) {
        console.error("Logout API call failed:", err);
      } finally {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = "index.html";
      }
  };

  /**
   * Show the target section and hide all others.
   * Updates active styles for both desktop and mobile nav links.
   */
  const navigateTo = (targetId) => {

      // --- Show/hide sections ---
      sections.forEach(id => {
          const section = document.getElementById(id);
          if (section) {
              section.classList.toggle('hidden', id !== targetId);
          }
      });

      // --- Update desktop active link styles ---
      document.querySelectorAll('.nav-link').forEach(navLink => {
          const linkTarget = navLink.getAttribute('href').substring(1);
          if (linkTarget === targetId) {
              navLink.className = "nav-link text-sm font-bold text-blue-600 border-b-2 border-blue-600 pb-0.5";
          } else {
              navLink.className = "nav-link text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors";
          }
      });

      // --- Update mobile active link styles ---
      document.querySelectorAll('.nav-link-mobile').forEach(navLink => {
          const linkTarget = navLink.getAttribute('href').substring(1);
          if (linkTarget === targetId) {
              navLink.className = "nav-link-mobile text-sm font-bold text-blue-600 bg-blue-50 px-2 py-2 rounded-lg";
          } else {
              navLink.className = "nav-link-mobile text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-gray-50 px-2 py-2 rounded-lg transition-colors";
          }
      });
  };

  // --- Populate navbar name ---
  const firstName = getFirstName();
  if (firstNameEl) firstNameEl.textContent = firstName;
  if (firstNameMobileEl) firstNameMobileEl.textContent = firstName;

  // --- Desktop nav link clicks ---
  document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('href').substring(1);
          navigateTo(targetId);
      });
  });

  // --- Mobile nav link clicks ---
  document.querySelectorAll('.nav-link-mobile').forEach(link => {
      link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('href').substring(1);
          navigateTo(targetId);
          // Close mobile menu after navigation
          mobileMenu.classList.remove('open');
      });
  });

  // --- Logout buttons ---
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
  if (logoutBtnMobile) logoutBtnMobile.addEventListener("click", logout);

  // --- Cancel button ---
  if (cancelBtn) cancelBtn.addEventListener("click", () => {
      navigateTo('dashboard');
  });

  // --- Hamburger toggle ---
  if (hamburgerBtn) {
      hamburgerBtn.addEventListener("click", () => {
          mobileMenu.classList.toggle("open");
      });
  }

  // --- Show dashboard section by default on load ---
  navigateTo('dashboard');

  // --- Listen for navigation events dispatched from module scripts ---
  window.addEventListener("navigateTo", (e) => {
      navigateTo(e.detail.section);
  });

  // ============================================================
  // CONSTANTS & CONFIGURATION
  // ============================================================

  const AUTH_TOKEN_KEY = "ntc_access_token";
  const form = document.getElementById("document-request-form");

  if (!form) {
    console.error("Form element with id 'document-request-form' not found in the DOM");
    alert("Error: Form not found. Please refresh the page.");
    return;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  const getAuthToken = () => sessionStorage.getItem(AUTH_TOKEN_KEY);

  let documentMap = {}; // Stores mapping of documentType -> document info

  /**
   * Format raw enum string to Title Case
   * e.g. CERTIFICATE_OF_ENROLLMENT -> Certificate Of Enrollment
   */
  const formatLabel = (type) =>
    type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  // ============================================================
  // LOAD DOCUMENT TYPES
  // ============================================================

  /**
   * Fetch and populate available document types for the student
   */
  const loadDocumentTypes = async () => {
    try {
      const token = getAuthToken();

      console.log("=== LOAD DOCUMENTS DEBUG ===");
      console.log("Token exists:", !!token);
      console.log("Token length:", token?.length || 0);
      if (token) {
        console.log("Token value (FULL):", token);
      }
      console.log("SessionStorage entries:", sessionStorage.length);
      console.log("=== END DEBUG ===\n");

      if (!token) {
        console.error("No auth token found");
        alert("Session expired. Please log in again.");
        window.location.href = "index.html";
        return;
      }

      const documents = await getStudentDocuments(token);
      const documentTypeSelect = document.getElementById("documentType");

      if (documentTypeSelect && Array.isArray(documents) && documents.length > 0) {

        // Build map of documentType -> document info
        documentMap = {};
        documents.forEach(doc => {
          if (!documentMap[doc.documentType]) {
            documentMap[doc.documentType] = {
              id: doc.id,
              studentFullName: doc.studentFullName,
            };
          }
        });

        // Get unique document types
        const uniqueTypes = Object.keys(documentMap);

        // Populate the select dropdown
        documentTypeSelect.innerHTML = '<option value="" disabled selected>Select document type</option>';
        uniqueTypes.forEach(type => {
          const option = document.createElement("option");
          option.value = type;
          // Bug 4 fix: format enum to proper Title Case
          option.textContent = formatLabel(type);
          documentTypeSelect.appendChild(option);
        });

        console.log("Successfully loaded", uniqueTypes.length, "document types");
      }

    } catch (error) {
      console.error("Error loading document types:", error);
      alert("Error loading documents. Please try again.");
    }
  };

  // Load documents on page load
  await loadDocumentTypes();

  // ============================================================
  // LOAD DOCUMENT REQUESTS
  // ============================================================

  /**
   * Fetch and display student's document requests
   */
  const loadDocumentRequests = async () => {
    try {
      const token = getAuthToken();

      if (!token) {
        console.error("No auth token found");
        return;
      }

      // --- Step 1: Fetch all requests ---
      const requests = await getStudentRequests(token);
      const container = document.getElementById("document-requests-container");

      // --- Step 2: Console log all requests ---
      console.log("=== STUDENT DOCUMENT REQUESTS ===");
      console.log("Total requests:", requests.length);
      console.log("Requests:", requests);
      requests.forEach((req, idx) => {
        console.log(`  [${idx}] ID: ${req.id}, Type: ${req.documentType}, Status: ${req.status}, Date: ${req.requestedAt}`);
      });
      console.log("=== END REQUESTS ===\n");

      if (container && Array.isArray(requests)) {
        container.innerHTML = ""; // Clear existing content

        if (requests.length === 0) {
          container.innerHTML = "<p class='text-gray-600'>No document requests found.</p>";
          return;
        }

        // --- Step 3: Render each request and load its logs ---
        for (const request of requests) {
          const requestDiv = document.createElement("div");
          requestDiv.className = "bg-white p-4 rounded-lg shadow mb-4 cursor-pointer hover:bg-gray-50 transition-colors";
          // Added 'cursor-pointer' and 'hover' for better UX

          requestDiv.innerHTML = `
            <div class="flex justify-between items-center">
              <div>
                <h1 class="text-xl font-bold text-gray-700">${formatLabel(request.documentType)}</h1>
                <p class="text-sm text-gray-500">${new Date(request.requestedAt).toLocaleDateString()}</p>
              </div>
              <div class="text-right">
                <span class="px-3 py-1 rounded-full text-sm font-bold ${request.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}">
                  ${request.status}
                </span>
              </div>
            </div>
            <!-- Log container is hidden by default -->
            <div id="logs-${request.id}" class="mt-4 pt-4 border-t border-gray-100 hidden">
              <p class="text-sm text-gray-500">Loading logs...</p>
            </div>
          `;

          // Toggle Logic
          requestDiv.onclick = async () => {
            const logsContainer = document.getElementById(`logs-${request.id}`);
            const isHidden = logsContainer.classList.contains('hidden');

            // Close all other open logs first
            document.querySelectorAll('[id^="logs-"]').forEach(el => el.classList.add('hidden'));

            // If it was hidden, open it and load data
            if (isHidden) {
              logsContainer.classList.remove('hidden');
              await loadRequestLogs(request.id);
            }
          };

          container.appendChild(requestDiv);
        }

      }

    } catch (error) {
      console.error("Error loading document requests:", error);
    }
  };

  /**
   * Fetch and display logs for a specific document request
   */
  const loadRequestLogs = async (documentRequestId) => {
    try {
      const token = getAuthToken();

      console.log(`\n=== LOAD LOGS DEBUG (Request ID: ${documentRequestId}) ===`);
      console.log("Token exists:", !!token);
      console.log("Token length:", token?.length || 0);
      
      if (!token) {
        console.error("No auth token found");
        return;
      }

      console.log("=== END DEBUG ===\n");
      const logs = await getRequestLogs(token, documentRequestId);
      const logsContainer = document.getElementById(`logs-${documentRequestId}`);

      // --- Console log the logs for this request ---
      console.log(`--- Logs for Request ID ${documentRequestId} ---`);
      console.log("Total logs:", logs.length);
      if (Array.isArray(logs) && logs.length > 0) {
        logs.forEach((log, idx) => {
          console.log(`  [${idx}] Status: ${log.requestStatus}, Date: ${log.dateAction}, Remarks: ${log.remarks || 'N/A'}`);
        });
      }
      console.log("---\n");

      if (logsContainer && Array.isArray(logs)) {
        if (logs.length === 0) {
          logsContainer.innerHTML = "<p class='text-sm text-gray-500'>No logs available.</p>";
          return;
        }

        logsContainer.innerHTML = "<h6 class='text-md font-semibold text-gray-700 mb-2'>Request Logs:</h6>";

        logs.forEach((log) => {
          const logDiv = document.createElement("div");
          logDiv.className = "text-sm text-gray-600 mb-1";
          logDiv.innerHTML = `
            <span class="font-medium">${log.requestStatus}</span> - ${new Date(log.dateAction).toLocaleString()} ${log.remarks ? `- ${log.remarks}` : ''}
          `;
          logsContainer.appendChild(logDiv);
        });
      }

    } catch (error) {
      console.error("Error loading request logs:", error);
    }
  };

  // Load document requests on page load
  await loadDocumentRequests();

  // ============================================================
  // FORM SUBMISSION
  // ============================================================

  /**
   * Handle form submission to create a document request
   */
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // --- Get form values ---
    const purpose = document.getElementById("purpose").value;
    const documentType = document.getElementById("documentType").value;
    const additionalDetails = document.getElementById("additionalDetails").value.trim();

    // --- Bug 3 fix: validate purpose before submission ---
    if (!purpose) {
      alert("Please select a purpose.");
      return;
    }

    // --- Validate document type selection ---
    const documentId = documentMap[documentType]?.id;
    if (!documentId) {
      alert("Please select a valid document type.");
      return;
    }

    // --- Get user info from session storage ---
    const studentId = sessionStorage.getItem("userId");
    if (!studentId) {
      alert("Session error. Please log in again.");
      window.location.href = "index.html";
      return;
    }

    // --- Bug 2 fix: disable submit button during fetch ---
    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      const token = getAuthToken();

      // --- Debug: Check token status ---
      console.log("=== FORM SUBMISSION DEBUG ===");
      console.log("Token exists:", !!token);
      console.log("Token length:", token?.length || 0);
      if (token) {
        console.log("Token value (FULL):", token);
        console.log("Token includes 'Bearer'?", token.includes("Bearer"));
      }
      console.log("SessionStorage contents:");
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        console.log(`  ${key}:`, value?.substring ? value.substring(0, 40) + "..." : value);
      }
      console.log("=== END DEBUG ===\n");

      if (!token) {
        throw new Error("No auth token found. Please log in again.");
      }

      // --- Build request payload ---
      const requestBody = {
        purpose,
        documentType,
        documentId,
        additionalDetails,
        remarks: "",
        status: "PENDING",
        studentId: Number(studentId),
      };

      console.log("Request payload:", requestBody);

      // --- Send request ---
      const data = await submitDocumentRequest(token, requestBody);
      const requestId = data?.requestId ?? data?.id ?? data?.data?.requestId ?? null;

      const messageContainer = document.getElementById("status-message");

      if (requestId) {
        console.log("Request submitted successfully. Request ID:", requestId);
        // Show Success Message
        messageContainer.textContent = "Document request submitted successfully!";
        messageContainer.className = "w-full max-w-lg mb-4 p-4 rounded-lg text-sm font-medium border bg-green-50 border-green-200 text-green-700";
        messageContainer.classList.remove("hidden");

        // Reset form and refresh requests list
        form.reset();
        await loadDocumentRequests();

        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = "Request Document";
      } else {
        throw new Error("No request ID returned by API");
      }

    } catch (error) {
      console.error("Error submitting request:", error.message);
      const messageContainer = document.getElementById("status-message");
    
      // Check if the error is the "Active Request" message or a generic one
      // Note: Adjust 'error.message' depending on how your apiRequest handles 400 errors
      let errorMessage = "An error occurred. Please try again.";
      // Try to parse the specific message from your API response
      if (error.message) {
          try {
              // In case the error.message is a JSON string
              const parsedError = JSON.parse(error.message);
              errorMessage = parsedError.message;
          } catch (e) {
              // If it's already a string, use it directly
              errorMessage = error.message;
          }
      }

      // Show Error Message
      // Display the message with Red styling
      messageContainer.textContent = errorMessage;
      messageContainer.className = "w-full max-w-lg mb-4 p-4 rounded-xl border bg-red-50 border-red-200 text-red-800 block";

      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = "Request Document";
      
      console.error("Submission failed:", errorMessage);
      }
  });

});