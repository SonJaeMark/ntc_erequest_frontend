document.addEventListener("DOMContentLoaded", async () => {

  // ============================================================
  // CONSTANTS & CONFIGURATION
  // ============================================================

  const AUTH_TOKEN_KEY = "ntc_access_token";
  const BASE_URL = "https://ntc-erquest-system-1.onrender.com";
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

      const response = await fetch(`${BASE_URL}/api/document/student`, {
        method: "GET",
        mode: "cors",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch documents:", response.status, errorText);
        alert("Failed to load documents. Please try again.");
        return;
      }

      const documents = await response.json();
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
      const response = await fetch(`${BASE_URL}/api/document-request/student`, {
        method: "GET",
        mode: "cors",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch requests:", response.status, errorText);
        return;
      }

      const requests = await response.json();
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
          requestDiv.className = "bg-white p-4 rounded-lg shadow mb-4";

          requestDiv.innerHTML = `
            <h1 class="text-xl font-bold text-gray-700 mb-2">${formatLabel(request.documentType)}</h1>
            <div>
              <h5 class="text-lg font-bold text-gray-600">Status: ${request.status}</h5>
              <p>${new Date(request.requestedAt).toLocaleDateString()}</p>
            </div>
            <div id="logs-${request.id}" class="mt-4">
              <p class="text-sm text-gray-500">Loading logs...</p>
            </div>
          `;

          container.appendChild(requestDiv);

          // Load logs for this request
          await loadRequestLogs(request.id);
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

      // Log the full token and header
      console.log("Full token:", token);
      const authHeader = `Bearer ${token}`;
      console.log("Authorization header:", authHeader.substring(0, 60) + "...");

      const fetchOptions = {
        method: "GET",
        mode: "cors",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
      };

      console.log("Fetch URL:", `${BASE_URL}/logs/${documentRequestId}`);
      console.log("Fetch options:", {
        method: fetchOptions.method,
        mode: fetchOptions.mode,
        credentials: fetchOptions.credentials,
        headers: {
          "Accept": fetchOptions.headers.Accept,
          "Content-Type": fetchOptions.headers["Content-Type"],
          "Authorization": fetchOptions.headers.Authorization.substring(0, 60) + "...",
        },
      });
      console.log("=== END DEBUG ===\n");

      const response = await fetch(`${BASE_URL}/api/document-request/logs/${documentRequestId}`, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch logs:", response.status, errorText);
        return;
      }

      const logs = await response.json();
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
        registrarId: 0,
      };

      console.log("Request payload:", requestBody);

      // --- Build headers ---
      const headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      // --- Build fetch options ---
      const fetchOptions = {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        credentials: "include",
        headers: headers,
        body: JSON.stringify(requestBody),
      };

      console.log("Request headers:");
      console.log("  Accept:", headers.Accept);
      console.log("  Content-Type:", headers["Content-Type"]);
      console.log("  Authorization:", headers["Authorization"].substring(0, 40) + "...");
      console.log("Fetch options:", fetchOptions);

      // --- Send request ---
      const response = await fetch(`${BASE_URL}/api/document-request/submit`, fetchOptions);
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} - ${text}`);
      }

      // --- Handle response ---
      const data = text ? JSON.parse(text) : null;
      const requestId = data?.requestId ?? data?.id ?? data?.data?.requestId ?? null;

      if (requestId) {
        console.log("Request submitted successfully. Request ID:", requestId);
        alert("Document request submitted successfully!");

        // Reset form and refresh requests list
        form.reset();
        await loadDocumentRequests();

        // Bug 1 fix: dispatch custom event for SPA navigation instead of full page reload
        window.dispatchEvent(new CustomEvent("navigateTo", { detail: { section: "dashboard" } }));
      } else {
        throw new Error("No request ID returned by API");
      }

    } catch (error) {
      console.error("Error submitting request:", error.message);
      alert("Failed to submit request: " + error.message);

      // Bug 2 fix: re-enable submit button on error
      submitBtn.disabled = false;
      submitBtn.textContent = "Request Document";
    }
  });

});