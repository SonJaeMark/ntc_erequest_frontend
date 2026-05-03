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

        // --- Step 3: Set grid layout and render each request as a flippable card ---
        container.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;";

        for (const request of requests) {
          const statusClass = `status-${request.status}`;

          // Sprint 3: Show "Pay Now" button on front if status is AVAILABLE_TO_CLAIM
          const payBtn = request.status === "AVAILABLE_TO_CLAIM"
            ? `<button
                class="mt-2 w-full bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1.5 rounded-lg transition-colors"
                onclick="event.stopPropagation(); openPaymentModal('${request.id}', '${request.documentType}')">
                Pay via GCash
               </button>`
            : "";

          const card = document.createElement("div");
          card.className = "flip-card";
          card.innerHTML = `
            <div class="flip-card-inner">
              <div class="flip-card-front">
                <div>
                  <p style="font-size:13px;color:#6b7280;margin:0 0 4px">${formatLabel(request.documentType)}</p>
                  <p style="font-size:17px;font-weight:700;margin:0 0 10px;color:#1e3a5f">Document Request</p>
                  <span class="status-badge ${statusClass}">
                    <span class="status-dot"></span>${formatLabel(request.status)}
                  </span>
                  ${payBtn}
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:12px;color:#9ca3af">${new Date(request.requestedAt).toLocaleDateString()}</span>
                  <span class="flip-hint">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M2 8c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6"/>
                      <path d="M10 6l2 2-2 2"/>
                    </svg>
                    Flip for remarks
                  </span>
                </div>
              </div>
              <div class="flip-card-back">
                <div style="flex:1;overflow:hidden">
                  <p style="font-size:11px;font-weight:700;color:#6b7280;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em">Registrar Remarks</p>
                  <div id="logs-${request.id}" class="logs-scroll">
                    <p style="font-size:12px;color:#9ca3af">Loading logs...</p>
                  </div>
                </div>
                <span class="flip-hint" style="justify-content:flex-end;margin-top:8px">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 8c0 3.3-2.7 6-6 6S2 11.3 2 8s2.7-6 6-6"/>
                    <path d="M6 10l-2-2 2-2"/>
                  </svg>
                  Flip back
                </span>
              </div>
            </div>
          `;
          card.addEventListener("click", () => card.classList.toggle("flipped"));
          container.appendChild(card);

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

        logsContainer.innerHTML = "";

        logs.forEach((log) => {
          const logDiv = document.createElement("div");
          logDiv.className = "log-entry";
          logDiv.innerHTML = `
            <span style="font-size:11px;font-weight:700;color:#374151">${log.requestStatus}</span><br>
            ${log.remarks
              ? `<span>${log.remarks}</span><br>`
              : `<span style="color:#9ca3af;font-style:italic">No remarks provided.</span><br>`}
            <span style="font-size:11px;color:#9ca3af">${new Date(log.dateAction).toLocaleString()}</span>
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


  // ============================================================
  // SPRINT 3 — GCASH PAYMENT MODAL
  // ============================================================

  /**
   * Open the payment modal for a specific request.
   * Called from the "Pay via GCash" button on AVAILABLE_TO_CLAIM cards.
   * @param {string} requestId   - The document request ID
   * @param {string} documentType - Raw enum string for display
   */
  window.openPaymentModal = (requestId, documentType) => {
    const modal        = document.getElementById("payment-modal");
    const reqIdInput   = document.getElementById("payment-request-id");
    const docTypeEl    = document.getElementById("payment-doc-type");
    const refInput     = document.getElementById("gcash-reference");
    const amountInput  = document.getElementById("gcash-amount");
    const errorEl      = document.getElementById("payment-error");

    if (!modal) {
      console.error("Payment modal not found in the DOM.");
      return;
    }

    console.log("=== OPEN PAYMENT MODAL DEBUG ===");
    console.log("Request ID:", requestId);
    console.log("Document Type:", documentType);
    console.log("=== END DEBUG ===\n");

    // Populate fields
    if (reqIdInput)  reqIdInput.value       = requestId;
    if (docTypeEl)   docTypeEl.textContent  = formatLabel(documentType);
    if (refInput)    refInput.value         = "";
    if (amountInput) amountInput.value      = "";
    if (errorEl)     errorEl.classList.add("hidden");

    modal.classList.remove("hidden");
  };

  /**
   * Close the payment modal without submitting
   */
  window.closePaymentModal = () => {
    const modal = document.getElementById("payment-modal");
    if (modal) modal.classList.add("hidden");
  };

  /**
   * Submit GCash payment details linked to the document request.
   * Sends reference number and amount to the payment endpoint.
   */
  window.submitPayment = async () => {
    const requestId   = document.getElementById("payment-request-id")?.value;
    const reference   = document.getElementById("gcash-reference")?.value.trim();
    const amount      = document.getElementById("gcash-amount")?.value.trim();
    const errorEl     = document.getElementById("payment-error");
    const submitBtn   = document.getElementById("payment-submit-btn");
    const btnText     = document.getElementById("payment-btn-text");

    // --- Validate inputs ---
    if (!reference) {
      errorEl.textContent = "Please enter your GCash reference number.";
      errorEl.classList.remove("hidden");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      errorEl.textContent = "Please enter a valid amount.";
      errorEl.classList.remove("hidden");
      return;
    }

    errorEl.classList.add("hidden");

    // --- Disable button + show spinner ---
    submitBtn.disabled = true;
    btnText.textContent = "Submitting...";
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.id = "payment-spinner";
    submitBtn.prepend(spinner);

    try {
      const token = getAuthToken();

      console.log("=== PAYMENT SUBMISSION DEBUG ===");
      console.log("Token exists:", !!token);
      console.log("Token length:", token?.length || 0);
      if (token) {
        console.log("Token value (FULL):", token);
        console.log("Token includes 'Bearer'?", token.includes("Bearer"));
      }
      console.log("Request ID:", requestId);
      console.log("GCash Reference:", reference);
      console.log("Amount:", amount);
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
        documentRequestId: Number(requestId),
        referenceNumber: reference,
        amount: Number(amount),
        paymentMethod: "GCASH",
      };

      console.log("Payment payload:", requestBody);

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
      console.log("Fetch URL:", `${BASE_URL}/api/payment/submit`);
      console.log("Fetch options:", fetchOptions);

      // --- Send payment request ---
      const response = await fetch(`${BASE_URL}/api/payment/submit`, fetchOptions);
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Payment failed: ${response.status} - ${text}`);
      }

      const data = text ? JSON.parse(text) : null;

      console.log("Payment submitted successfully.");
      console.log("Response data:", data);

      alert("Payment submitted successfully! The registrar will verify your payment shortly.");

      // Close modal and refresh requests
      closePaymentModal();
      await loadDocumentRequests();

    } catch (error) {
      console.error("Error submitting payment:", error.message);
      errorEl.textContent = "Failed to submit payment: " + error.message;
      errorEl.classList.remove("hidden");

    } finally {
      // Re-enable button
      submitBtn.disabled = false;
      btnText.textContent = "Submit Payment";
      const spinner = document.getElementById("payment-spinner");
      if (spinner) spinner.remove();
    }
  };

});