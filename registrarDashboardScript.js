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
    const pending  = requests.filter(r => r.status === "PENDING").length;
    const review   = requests.filter(r => r.status === "IN_REVIEW").length;
    const approved = requests.filter(r => r.status === "APPROVED").length;

    const statPending  = document.getElementById("stat-pending");
    const statReview   = document.getElementById("stat-review");
    const statApproved = document.getElementById("stat-approved");

    if (statPending)  statPending.textContent  = pending;
    if (statReview)   statReview.textContent   = review;
    if (statApproved) statApproved.textContent = approved;

    console.log(`Stats — Pending: ${pending}, In Review: ${review}, Approved: ${approved}`);
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
  const buildTableRow = (req, includeDataAttr = false) => `
    <tr class="hover:bg-gray-50 transition-colors" ${includeDataAttr ? `data-status="${req.status}"` : ""}>
      <td class="px-6 py-4 font-medium text-gray-900">${req.studentFullName ?? "—"}</td>
      <td class="px-6 py-4 text-gray-600">${formatLabel(req.documentType)}</td>
      <td class="px-6 py-4 text-gray-500">
        ${new Date(req.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </td>
      <td class="px-6 py-4">${buildStatusBadge(req.status)}</td>
      <td class="px-6 py-4 text-right">
        <button
          class="text-blue-600 font-bold hover:text-blue-800 transition-colors text-sm"
          onclick="openProcessModal(${JSON.stringify(req).replace(/"/g, '&quot;')})">
          Process
        </button>
      </td>
    </tr>`;

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

      // --- Disable both action buttons while submitting ---
      const approveBtn = document.getElementById("modal-approve-btn");
      const rejectBtn  = document.getElementById("modal-reject-btn");
      if (approveBtn) { approveBtn.disabled = true; approveBtn.textContent = "Processing..."; }
      if (rejectBtn)  { rejectBtn.disabled  = true; rejectBtn.textContent  = "Processing..."; }

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
      // Re-enable buttons regardless of outcome
      const approveBtn = document.getElementById("modal-approve-btn");
      const rejectBtn  = document.getElementById("modal-reject-btn");
      if (approveBtn) { approveBtn.disabled = false; approveBtn.textContent = "Approve"; }
      if (rejectBtn)  { rejectBtn.disabled  = false; rejectBtn.textContent  = "Reject";  }
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
  // INITIAL LOAD
  // ============================================================

  // Load requests on page load — called last so all functions above are defined
  await loadAllRequests();

});