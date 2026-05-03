document.addEventListener("DOMContentLoaded", async () => {

  // ============================================================
  // CONSTANTS & CONFIGURATION
  // ============================================================

  const AUTH_TOKEN_KEY = "ntc_access_token";
  const BASE_URL = "https://ntc-erquest-system-1.onrender.com";

  // ============================================================
  // HELPERS
  // ============================================================

  const getAuthToken = () => sessionStorage.getItem(AUTH_TOKEN_KEY);

  /**
   * Format raw enum string to Title Case
   * e.g. CERTIFICATE_OF_ENROLLMENT -> Certificate Of Enrollment
   */
  const formatLabel = (type) =>
    String(type || "")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  // ============================================================
  // LOAD ALL DOCUMENT REQUESTS
  // ============================================================

  /**
   * Fetch all document requests and populate both tables and stat cards
   */
  const loadAllRequests = async () => {
    try {
      const token = getAuthToken();

      console.log("=== LOAD ALL REQUESTS DEBUG ===");
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

      const fetchOptions = {
        method: "GET",
        mode: "cors",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      };

      console.log("Fetch URL:", `${BASE_URL}/api/document-request/all`);
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

      const response = await fetch(`${BASE_URL}/api/document-request/all`, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch requests:", response.status, errorText);
        setTableError("recent-requests-body");
        setTableError("all-requests-body");
        return;
      }

      const requests = await response.json();

      // --- Console log all requests ---
      console.log("=== ALL DOCUMENT REQUESTS ===");
      console.log("Total requests:", requests.length);
      console.log("Requests:", requests);
      requests.forEach((req, idx) => {
        console.log(`  [${idx}] ID: ${req.id}, Type: ${req.documentType}, Status: ${req.status}, Student: ${req.studentFullName}, Date: ${req.requestedAt}`);
      });
      console.log("=== END REQUESTS ===\n");

      renderStatCards(requests);
      renderRecentRequests(requests);
      renderAllRequests(requests);

    } catch (error) {
      console.error("Error loading requests:", error.message);
      setTableError("recent-requests-body");
      setTableError("all-requests-body");
    }
  };

  // ============================================================
  // RENDER: STAT CARDS
  // ============================================================

  /**
   * Count requests by status and update the stat card numbers
   */
  const renderStatCards = (requests) => {
    // Sprint 2: updated to reflect new status flow
    const pending    = requests.filter(r => r.status === "PENDING").length;
    const processing = requests.filter(r => r.status === "PROCESSING").length;
    const available  = requests.filter(r => r.status === "AVAILABLE_TO_CLAIM").length;
    const approved   = requests.filter(r => r.status === "APPROVED").length;

    const statPending    = document.getElementById("stat-pending");
    const statProcessing = document.getElementById("stat-processing");
    const statAvailable  = document.getElementById("stat-available");
    const statApproved   = document.getElementById("stat-approved");

    if (statPending)    statPending.textContent    = pending;
    if (statProcessing) statProcessing.textContent = processing;
    if (statAvailable)  statAvailable.textContent  = available;
    if (statApproved)   statApproved.textContent   = approved;

    console.log(`Stats — Pending: ${pending}, Processing: ${processing}, Available: ${available}, Approved: ${approved}`);
  };

  // ============================================================
  // RENDER: RECENT REQUESTS (Overview — latest 5 only)
  // ============================================================

  const renderRecentRequests = (requests) => {
    const body = document.getElementById("recent-requests-body");
    if (!body) return;

    const recent = requests.slice(0, 5);

    if (recent.length === 0) {
      body.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No requests found.</td></tr>`;
      return;
    }

    body.innerHTML = recent.map(req => buildTableRow(req)).join("");
  };

  // ============================================================
  // RENDER: ALL REQUESTS (Full table)
  // ============================================================

  const renderAllRequests = (requests) => {
    const body = document.getElementById("all-requests-body");
    if (!body) return;

    if (requests.length === 0) {
      body.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No requests found.</td></tr>`;
      return;
    }

    body.innerHTML = requests.map(req => buildTableRow(req, true)).join("");
  };

  // ============================================================
  // BUILD: TABLE ROW HTML
  // ============================================================

  /**
   * Build a single <tr> for a document request
   * @param {object} req              - The request object
   * @param {boolean} includeDataAttr - Attach data-status for filter support
   */
  const buildTableRow = (req, includeDataAttr = false) => {
    const encodedReq = JSON.stringify(req).replace(/"/g, '&quot;');

    // Sprint 3: Show "Verify Payment" button if request has a pending payment
    const hasPayment = req.payment && req.payment.status === "PENDING";
    const actionBtn = hasPayment
      ? `<button
           class="text-green-600 font-bold hover:text-green-800 transition-colors text-sm mr-2"
           onclick="openPaymentVerifyModal(${encodedReq})">
           Verify Payment
         </button>
         <button
           class="text-blue-600 font-bold hover:text-blue-800 transition-colors text-sm"
           onclick="openProcessModal(${encodedReq})">
           Process
         </button>`
      : `<button
           class="text-blue-600 font-bold hover:text-blue-800 transition-colors text-sm"
           onclick="openProcessModal(${encodedReq})">
           Process
         </button>`;

    return `
    <tr class="hover:bg-gray-50 transition-colors" ${includeDataAttr ? `data-status="${req.status}"` : ""}>
      <td class="px-6 py-4 font-medium text-gray-900">${req.studentFullName ?? "—"}</td>
      <td class="px-6 py-4 text-gray-600">${formatLabel(req.documentType)}</td>
      <td class="px-6 py-4 text-gray-500">
        ${new Date(req.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </td>
      <td class="px-6 py-4">${buildStatusBadge(req.status)}</td>
      <td class="px-6 py-4 text-right">${actionBtn}</td>
    </tr>`;
  };

  /**
   * Build a colored status pill badge
   */
  const buildStatusBadge = (status) =>
    `<span class="status-badge status-${status}"><span class="status-dot"></span>${formatLabel(status)}</span>`;

  /**
   * Set a table body to an error fallback state
   */
  const setTableError = (bodyId) => {
    const body = document.getElementById(bodyId);
    if (body) {
      body.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-400">Failed to load requests. Please refresh.</td></tr>`;
    }
  };

  // ============================================================
  // PROCESS MODAL — Open
  // ============================================================

  /**
   * Open the process modal and populate it with the selected request's data.
   * Called from the Process button in each table row.
   * @param {object} req - The full request object
   */
  window.openProcessModal = (req) => {
    const modal        = document.getElementById("process-modal");
    const modalName    = document.getElementById("modal-student-name");
    const modalType    = document.getElementById("modal-doc-type");
    const modalStatus  = document.getElementById("modal-current-status");
    const modalRemarks = document.getElementById("modal-remarks");
    const modalReqId   = document.getElementById("modal-request-id");

    if (!modal) {
      console.error("Process modal not found in the DOM.");
      return;
    }

    console.log("=== OPEN MODAL DEBUG ===");
    console.log("Request ID:", req.id);
    console.log("Student:", req.studentFullName);
    console.log("Document Type:", req.documentType);
    console.log("Current Status:", req.status);
    console.log("=== END DEBUG ===\n");

    // Populate modal fields
    if (modalName)    modalName.textContent  = req.studentFullName ?? "—";
    if (modalType)    modalType.textContent  = formatLabel(req.documentType);
    if (modalStatus)  modalStatus.textContent = formatLabel(req.status);
    if (modalRemarks) modalRemarks.value     = "";
    if (modalReqId)   modalReqId.value       = req.id;

    // Show the modal
    modal.classList.remove("hidden");
  };

  // ============================================================
  // PROCESS MODAL — Close
  // ============================================================

  /**
   * Close the process modal without taking any action
   */
  window.closeProcessModal = () => {
    const modal = document.getElementById("process-modal");
    if (modal) modal.classList.add("hidden");
  };

  // ============================================================
  // PROCESS MODAL — Submit (Approve / Reject)
  // ============================================================

  /**
   * Handle Approve or Reject button clicks inside the modal.
   * Sends a POST to update the request status with optional remarks.
   * @param {string} action - "APPROVED" or "REJECTED"
   */
  window.submitProcess = async (action) => {
    try {
      const token = getAuthToken();

      const requestId   = document.getElementById("modal-request-id")?.value;
      const remarks     = document.getElementById("modal-remarks")?.value.trim() || "";
      const registrarId = Number(sessionStorage.getItem("userId")) || 0;

      if (!requestId) {
        alert("Something went wrong. Please close and try again.");
        return;
      }

      // --- Disable all action buttons while submitting ---
      const approveBtn     = document.getElementById("modal-approve-btn");
      const rejectBtn      = document.getElementById("modal-reject-btn");
      const processingBtn  = document.getElementById("modal-processing-btn");
      const availableBtn   = document.getElementById("modal-available-btn");
      [approveBtn, rejectBtn, processingBtn, availableBtn].forEach(btn => {
        if (btn) { btn.disabled = true; btn.textContent = "Processing..."; }
      });

      // --- Build request payload ---
      const requestBody = {
        status: action,
        remarks,
        registrarId,
      };

      console.log("=== SUBMIT PROCESS DEBUG ===");
      console.log("Token exists:", !!token);
      console.log("Token length:", token?.length || 0);
      if (token) {
        console.log("Token value (FULL):", token);
        console.log("Token includes 'Bearer'?", token.includes("Bearer"));
      }
      console.log("Request ID:", requestId);
      console.log("Action:", action);
      console.log("Remarks:", remarks);
      console.log("Registrar ID:", registrarId);
      console.log("Request payload:", requestBody);
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
      console.log("Fetch URL:", `${BASE_URL}/api/document-request/update/${requestId}`);
      console.log("Fetch options:", fetchOptions);

      // --- Send request ---
      const response = await fetch(`${BASE_URL}/api/document-request/update/${requestId}`, fetchOptions);
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Update failed: ${response.status} - ${text}`);
      }

      // --- Handle response ---
      const data = text ? JSON.parse(text) : null;

      console.log("Request processed successfully.");
      console.log("Action:", action, "| Request ID:", requestId);
      console.log("Response data:", data);

      alert(`Request successfully ${formatLabel(action)}.`);

      // Close modal and reload the requests list
      closeProcessModal();
      await loadAllRequests();

    } catch (error) {
      console.error("Error processing request:", error.message);
      alert("Failed to process request: " + error.message);

    } finally {
      // Re-enable all buttons regardless of outcome
      const approveBtn    = document.getElementById("modal-approve-btn");
      const rejectBtn     = document.getElementById("modal-reject-btn");
      const processingBtn = document.getElementById("modal-processing-btn");
      const availableBtn  = document.getElementById("modal-available-btn");
      if (approveBtn)    { approveBtn.disabled    = false; approveBtn.textContent    = "Approve"; }
      if (rejectBtn)     { rejectBtn.disabled     = false; rejectBtn.textContent     = "Reject"; }
      if (processingBtn) { processingBtn.disabled = false; processingBtn.textContent = "Mark Processing"; }
      if (availableBtn)  { availableBtn.disabled  = false; availableBtn.textContent  = "Available to Claim"; }
    }
  };

  // ============================================================
  // STATUS FILTER (All Requests table)
  // ============================================================

  const filterStatus = document.getElementById("filter-status");
  if (filterStatus) {
    filterStatus.addEventListener("change", (e) => {
      const val = e.target.value;

      document.querySelectorAll("#all-requests-body tr[data-status]").forEach(row => {
        row.style.display = (!val || row.dataset.status === val) ? "" : "none";
      });

      console.log("Filter applied:", val || "ALL");
    });
  }


  // ============================================================
  // SPRINT 3 — PAYMENT VERIFICATION MODAL
  // ============================================================

  /**
   * Open the payment verification modal for a request that has a pending payment.
   * Called from the "Verify Payment" button in the table row.
   * @param {object} req - The full request object including payment details
   */
  window.openPaymentVerifyModal = (req) => {
    const modal       = document.getElementById("payment-verify-modal");
    const paymentId   = document.getElementById("verify-payment-id");
    const studentName = document.getElementById("verify-student-name");
    const docType     = document.getElementById("verify-doc-type");
    const reference   = document.getElementById("verify-reference");
    const amount      = document.getElementById("verify-amount");
    const errorEl     = document.getElementById("verify-error");

    if (!modal) {
      console.error("Payment verify modal not found in the DOM.");
      return;
    }

    console.log("=== OPEN PAYMENT VERIFY MODAL DEBUG ===");
    console.log("Request ID:", req.id);
    console.log("Student:", req.studentFullName);
    console.log("Payment reference:", req.payment?.referenceNumber);
    console.log("Amount:", req.payment?.amount);
    console.log("=== END DEBUG ===");

    if (paymentId)   paymentId.value          = req.payment?.id ?? req.id;
    if (studentName) studentName.textContent  = req.studentFullName ?? "—";
    if (docType)     docType.textContent      = formatLabel(req.documentType);
    if (reference)   reference.textContent    = req.payment?.referenceNumber ?? "—";
    if (amount)      amount.textContent       = req.payment?.amount ? `₱${req.payment.amount}` : "—";
    if (errorEl)     errorEl.classList.add("hidden");

    modal.classList.remove("hidden");
  };

  /**
   * Close the payment verification modal
   */
  window.closePaymentVerifyModal = () => {
    const modal = document.getElementById("payment-verify-modal");
    if (modal) modal.classList.add("hidden");
  };

  /**
   * Submit payment verification decision (CONFIRMED or REJECTED).
   * @param {string} decision - "CONFIRMED" or "REJECTED"
   */
  window.submitPaymentVerification = async (decision) => {
    const paymentId    = document.getElementById("verify-payment-id")?.value;
    const errorEl      = document.getElementById("verify-error");
    const confirmBtn   = document.getElementById("verify-confirm-btn");
    const rejectBtn    = document.getElementById("verify-reject-btn");
    const btnText      = document.getElementById("verify-btn-text");

    if (!paymentId) {
      errorEl.textContent = "Something went wrong. Please close and try again.";
      errorEl.classList.remove("hidden");
      return;
    }

    // --- Disable buttons + show spinner ---
    [confirmBtn, rejectBtn].forEach(btn => { if (btn) btn.disabled = true; });
    if (btnText) btnText.textContent = "Submitting...";
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.id = "verify-spinner";
    if (confirmBtn) confirmBtn.prepend(spinner);

    try {
      const token = getAuthToken();
      const registrarId = Number(sessionStorage.getItem("userId")) || 0;

      console.log("=== PAYMENT VERIFICATION DEBUG ===");
      console.log("Token exists:", !!token);
      console.log("Token length:", token?.length || 0);
      if (token) {
        console.log("Token value (FULL):", token);
        console.log("Token includes 'Bearer'?", token.includes("Bearer"));
      }
      console.log("Payment ID:", paymentId);
      console.log("Decision:", decision);
      console.log("Registrar ID:", registrarId);
      console.log("SessionStorage contents:");
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        console.log(`  ${key}:`, value?.substring ? value.substring(0, 40) + "..." : value);
      }
      console.log("=== END DEBUG ===");

      if (!token) {
        throw new Error("No auth token found. Please log in again.");
      }

      const requestBody = {
        status: decision,
        registrarId,
      };

      console.log("Payment verification payload:", requestBody);

      const headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

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
      console.log("Fetch URL:", `${BASE_URL}/api/payment/verify/${paymentId}`);
      console.log("Fetch options:", fetchOptions);

      const response = await fetch(`${BASE_URL}/api/payment/verify/${paymentId}`, fetchOptions);
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status} - ${text}`);
      }

      const data = text ? JSON.parse(text) : null;

      console.log("Payment verification submitted successfully.");
      console.log("Decision:", decision, "| Payment ID:", paymentId);
      console.log("Response data:", data);

      alert(`Payment ${formatLabel(decision)} successfully.`);

      closePaymentVerifyModal();
      await loadAllRequests();

    } catch (error) {
      console.error("Error verifying payment:", error.message);
      errorEl.textContent = "Failed to verify payment: " + error.message;
      errorEl.classList.remove("hidden");

    } finally {
      [confirmBtn, rejectBtn].forEach(btn => { if (btn) btn.disabled = false; });
      if (btnText) btnText.textContent = "Confirm Payment";
      const sp = document.getElementById("verify-spinner");
      if (sp) sp.remove();
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  // Load requests on page load — called last so all functions above are defined
  await loadAllRequests();

});