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
  const paymentModal = document.getElementById("payment-modal");
  const paymentModalTitle = document.getElementById("payment-modal-title");
  const paymentRequestId = document.getElementById("payment-request-id");
  const paymentModalClose = document.getElementById("payment-modal-close");
  const paymentMethodSelect = document.getElementById("payment-method");
  const paymentConfirmBtn = document.getElementById("payment-confirm-btn");

  const sections = ['dashboard', 'request-document', 'my-requests'];
  let activePaymentRequest = null;
  let lastPaymentTrigger = null;

  // --- Helpers ---
  /**
   * Returns the student's first name.
   * Prefers the 'firstName' key stored at login; falls back to email prefix.
   */
  const getFirstName = () => {
      const stored = sessionStorage.getItem("firstName");
      if (stored && stored.trim()) return stored.trim();
      const email = sessionStorage.getItem("email") ?? "";
      return email.split("@")[0] || "Student";
  };

  const openPaymentModal = (request, triggerButton) => {
      if (!paymentModal) return;

      activePaymentRequest = {
          id: request.id,
          documentType: request.documentType,
          paymentMethod: "",
      };
      lastPaymentTrigger = triggerButton;

      if (paymentModalTitle) paymentModalTitle.textContent = `${formatLabel(request.documentType)} Payment`;
      if (paymentRequestId) paymentRequestId.textContent = `Request ID: ${request.id}`;
      if (paymentMethodSelect) paymentMethodSelect.value = "";
      if (paymentConfirmBtn) paymentConfirmBtn.disabled = true;

      paymentModal.classList.remove("hidden");
      document.body.classList.add("overflow-hidden");
      paymentMethodSelect?.focus();
  };

  const closePaymentModal = () => {
      if (!paymentModal) return;

      paymentModal.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
      activePaymentRequest = null;
      if (paymentMethodSelect) paymentMethodSelect.value = "";
      if (paymentConfirmBtn) paymentConfirmBtn.disabled = true;

      if (lastPaymentTrigger) {
          lastPaymentTrigger.focus();
          lastPaymentTrigger = null;
      }
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
              navLink.setAttribute('aria-current', 'page');
          } else {
              navLink.className = "nav-link text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors";
              navLink.removeAttribute('aria-current');
          }
      });

      // --- Update mobile active link styles ---
      document.querySelectorAll('.nav-link-mobile').forEach(navLink => {
          const linkTarget = navLink.getAttribute('href').substring(1);
          if (linkTarget === targetId) {
              navLink.className = "nav-link-mobile text-sm font-bold text-blue-600 bg-blue-50 px-2 py-2 rounded-lg";
              navLink.setAttribute('aria-current', 'page');
          } else {
              navLink.className = "nav-link-mobile text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-gray-50 px-2 py-2 rounded-lg transition-colors";
              navLink.removeAttribute('aria-current');
          }
      });
  };

  // --- Populate navbar name ---
  const firstName = getFirstName();
  if (firstNameEl) firstNameEl.textContent = firstName;
  if (firstNameMobileEl) firstNameMobileEl.textContent = firstName;
  const dashboardFirstNameEl = document.getElementById("dashboard-firstname");
  if (dashboardFirstNameEl) dashboardFirstNameEl.textContent = firstName;

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

  if (paymentModalClose) paymentModalClose.addEventListener("click", closePaymentModal);

  if (paymentModal) {
      paymentModal.addEventListener("click", (event) => {
          if (event.target === paymentModal) {
              closePaymentModal();
          }
      });
  }

  document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && paymentModal && !paymentModal.classList.contains("hidden")) {
          closePaymentModal();
      }
  });

  if (paymentConfirmBtn) {
      paymentConfirmBtn.addEventListener("click", () => {
          if (!activePaymentRequest || !activePaymentRequest.paymentMethod) return;
          console.log("Payment method handler placeholder:", activePaymentRequest);
      });
  }

  if (paymentMethodSelect) {
      paymentMethodSelect.addEventListener("change", () => {
          if (!activePaymentRequest) return;

          activePaymentRequest.paymentMethod = paymentMethodSelect.value;
          if (paymentConfirmBtn) {
              paymentConfirmBtn.disabled = !paymentMethodSelect.value;
          }
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
    String(type ?? "")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const formatDate = (dateValue) => {
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime()) ? "No date available" : date.toLocaleDateString();
  };

  const formatDateTime = (dateValue) => {
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime()) ? "No date available" : date.toLocaleString();
  };

  const createMessage = (text, className) => {
    const message = document.createElement("p");
    message.className = className;
    message.textContent = text;
    return message;
  };

  const canPayRequest = (status) =>
    ["PENDING", "PROCESSING"].includes(String(status ?? "").toUpperCase());

  const canCancelRequest = (status) =>
    String(status ?? "").toUpperCase() === "PENDING";

  // ============================================================
  // LOAD DOCUMENT TYPES
  // ============================================================

  /**
   * Fetch and populate available document types for the student
   */
  const loadDocumentTypes = async () => {
    try {
      const token = getAuthToken();

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

      // --- Status badge color map ---
      const statusStyles = {
        PENDING:    'bg-yellow-100 text-yellow-700',
        PROCESSING: 'bg-blue-100 text-blue-700',
        COMPLETED:  'bg-green-100 text-green-700',
        Completed:  'bg-green-100 text-green-700',
        REJECTED:   'bg-red-100 text-red-700',
        CANCELLED:  'bg-gray-100 text-gray-700',
      };
      const getStatusStyle = (status) =>
        statusStyles[status] ?? 'bg-gray-100 text-gray-700';

      // --- Step 1: Fetch all requests ---
      const requests = await getStudentRequests(token);
      const container = document.getElementById("document-requests-container");

      if (!Array.isArray(requests)) {
        console.error("Unexpected response format for requests:", requests);
        if (container) {
          container.replaceChildren(createMessage("Failed to load requests.", "text-gray-600"));
        }
        return;
      }

      console.log("Total requests:", requests.length);

      if (container) {
        container.replaceChildren();

        if (requests.length === 0) {
          container.replaceChildren(createMessage("No document requests found.", "text-gray-600 p-2"));
          return;
        }

        // --- Step 2: Render each request ---
        for (const request of requests) {
          const requestDiv = document.createElement("div");
          requestDiv.className = "bg-white p-4 rounded-lg shadow mb-4 cursor-pointer hover:bg-gray-50 transition-colors";

          const header = document.createElement("div");
          header.className = "flex items-center justify-between gap-4";

          const titleGroup = document.createElement("div");

          const title = document.createElement("h1");
          title.className = "text-xl font-bold text-gray-700";
          title.textContent = formatLabel(request.documentType);

          const requestedDate = document.createElement("p");
          requestedDate.className = "text-sm text-gray-500";
          requestedDate.textContent = formatDate(request.requestedAt);

          titleGroup.append(title, requestedDate);

          const statusGroup = document.createElement("div");
          statusGroup.className = "flex shrink-0 items-center gap-2 text-right";

          const statusBadge = document.createElement("span");
          statusBadge.className = `px-3 py-1 rounded-full text-sm font-bold ${getStatusStyle(request.status)}`;
          statusBadge.textContent = request.status ?? "UNKNOWN";

          const payButton = document.createElement("button");
          payButton.type = "button";
          payButton.dataset.payButton = "true";
          payButton.className = "hidden rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 active:scale-[0.98]";
          payButton.textContent = "Pay Now";
          payButton.addEventListener("click", (event) => {
            event.stopPropagation();
            openPaymentModal(request, payButton);
          });

          const cancelButton = document.createElement("button");
          cancelButton.type = "button";
          cancelButton.dataset.cancelButton = "true";
          cancelButton.className = "hidden rounded-lg border border-red-200 px-3 py-1.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 active:scale-[0.98]";
          cancelButton.textContent = "Cancel";
          cancelButton.addEventListener("click", (event) => {
            event.stopPropagation();

            const shouldCancel = confirm("Cancel this document request?");
            if (!shouldCancel) return;

            // TODO: Replace this UI-only placeholder with the cancel request API call once documentApi.js is ready.
            request.status = "CANCELLED";
            statusBadge.textContent = "CANCELLED";
            statusBadge.className = `px-3 py-1 rounded-full text-sm font-bold ${getStatusStyle(request.status)}`;
            payButton.classList.add("hidden");
            cancelButton.classList.add("hidden");
            console.log("Cancel request placeholder:", {
              requestId: request.id,
              status: request.status,
            });
          });

          statusGroup.append(statusBadge);
          if (canPayRequest(request.status)) {
            statusGroup.append(payButton);
          }
          if (canCancelRequest(request.status)) {
            statusGroup.append(cancelButton);
          }
          header.append(titleGroup, statusGroup);

          const logsContainer = document.createElement("div");
          logsContainer.id = `logs-${request.id}`;
          logsContainer.className = "mt-4 hidden border-t border-gray-100 pt-4";
          logsContainer.replaceChildren(createMessage("Loading logs...", "text-sm text-gray-500"));

          requestDiv.append(header, logsContainer);

          // Toggle Logic — use addEventListener for safer event handling
          requestDiv.addEventListener('click', async () => {
            const isHidden = logsContainer.classList.contains('hidden');

            // Close all other open logs first
            document.querySelectorAll('[id^="logs-"]').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('[data-pay-button="true"]').forEach(button => button.classList.add('hidden'));
            document.querySelectorAll('[data-cancel-button="true"]').forEach(button => button.classList.add('hidden'));

            // If it was hidden, open it and load data
            if (isHidden) {
              logsContainer.classList.remove('hidden');
              if (canPayRequest(request.status)) {
                payButton.classList.remove('hidden');
              }
              if (canCancelRequest(request.status)) {
                cancelButton.classList.remove('hidden');
              }
              await loadRequestLogs(request.id);
            }
          });

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

      if (!token) {
        console.error("No auth token found");
        return;
      }

      const logs = await getRequestLogs(token, documentRequestId);
      const logsContainer = document.getElementById(`logs-${documentRequestId}`);

      if (logsContainer && Array.isArray(logs)) {
        if (logs.length === 0) {
          logsContainer.replaceChildren(createMessage("No logs available.", "text-sm text-gray-500"));
          return;
        }

        const heading = document.createElement("h6");
        heading.className = "text-md font-semibold text-gray-700 mb-2";
        heading.textContent = "Request Logs:";
        logsContainer.replaceChildren(heading);

        logs.forEach((log) => {
          const logDiv = document.createElement("div");
          logDiv.className = "text-sm text-gray-600 mb-1";

          const status = document.createElement("span");
          status.className = "font-medium";
          status.textContent = log.requestStatus ?? "UNKNOWN";

          const details = document.createTextNode(
            ` - ${formatDateTime(log.dateAction)}${log.remarks ? ` - ${log.remarks}` : ""}`
          );

          logDiv.append(status, details);
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

      if (!token) {
        throw new Error("No auth token found. Please log in again.");
      }

      console.log("Submitting document request...");

      // --- Build request payload ---
      const requestBody = {
        purpose,
        documentType,
        documentId,
        additionalDetails,
        remarks: "",
        status: "PENDING",
        studentId: Number(studentId),
        registrarId: 0,
      };

      console.log("Request payload:", { ...requestBody, studentId: requestBody.studentId });

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

        // Auto-hide success message after 4 seconds
        setTimeout(() => {
          messageContainer.classList.add("hidden");
        }, 4000);

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
