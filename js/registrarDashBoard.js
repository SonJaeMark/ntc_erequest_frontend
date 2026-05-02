import {
  getPendingRequests,
  acceptDocumentRequest,
} from "./apiClient/documentApi.js";
import { logout as apiLogout } from "./apiClient/authApi.js";

document.addEventListener("DOMContentLoaded", async () => {
  // --- Auth guard: requires REGISTRAR role ---
  requireRole(["REGISTRAR"]);

  const firstNameEl = document.getElementById("navbar-firstname");
  const logoutBtn = document.getElementById("logout-btn");
  const tableBody = document.getElementById("pool-requests-table-body");

  // --- Helpers ---
  const getFirstName = () => {
    const email = sessionStorage.getItem("email") ?? "";
    return email.split("@")[0] ?? "Registrar";
  };

  const getAuthToken = () => sessionStorage.getItem("ntc_access_token");

  const formatLabel = (type) =>
    type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

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

  // --- Actions ---
  const handleAccept = async (request) => {
    const token = getAuthToken();
    if (!token) return;

    const registrarId = sessionStorage.getItem("userId");
    
    // Prepare payload based on the API requirement
    const payload = {
      docrequestid: request.docrequestid,
      purpose: request.purpose,
      documentType: request.documentType,
      documentId: request.documentId,
      additionalDetails: request.additionalDetails,
      remarks: "Request accepted by registrar",
      status: "PROCESSING", // Or whatever the next status should be
      studentId: request.studentId,
      registrarId: Number(registrarId)
    };

    try {
      await acceptDocumentRequest(token, payload);
      alert("Request accepted successfully!");
      loadPoolRequests(); // Refresh table
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Failed to accept request: " + error.message);
    }
  };

  const loadPoolRequests = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const requests = await getPendingRequests(token);
      
      if (!tableBody) return;
      tableBody.innerHTML = "";

      if (!requests || requests.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="px-6 py-10 text-center text-gray-500">No pending requests found.</td>
          </tr>
        `;
        return;
      }

      requests.forEach((req) => {
        const row = document.createElement("tr");
        row.className = "hover:bg-gray-50 transition-colors";
        
        const dateStr = req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : "N/A";
        
        row.innerHTML = `
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">
                ${req.studentFullName ? req.studentFullName.charAt(0) : "S"}
              </div>
              <span class="font-bold text-gray-700">${req.studentFullName || "Unknown Student"}</span>
            </div>
          </td>
          <td class="px-6 py-4 font-medium text-gray-700">${formatLabel(req.documentType)}</td>
          <td class="px-6 py-4 text-gray-600">${formatLabel(req.purpose)}</td>
          <td class="px-6 py-4 text-gray-500">${dateStr}</td>
          <td class="px-6 py-4">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
              ${req.status}
            </span>
          </td>
          <td class="px-6 py-4 text-right">
            <button class="accept-btn text-sm font-bold text-white bg-green-500 hover:bg-green-600 px-4 py-1.5 rounded-lg transition-all active:scale-95">
              Accept
            </button>
          </td>
        `;

        // Add event listener to accept button
        const btn = row.querySelector(".accept-btn");
        btn.onclick = () => handleAccept(req);

        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Error loading pool requests:", error);
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="px-6 py-10 text-center text-red-500 font-bold">Error loading requests. Please try again.</td>
          </tr>
        `;
      }
    }
  };

  // --- Initialization ---
  if (firstNameEl) firstNameEl.textContent = getFirstName();
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  loadPoolRequests();
});
