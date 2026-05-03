import {
  getPendingRequests,
  acceptDocumentRequest,
  getRegistrarRequests,
  processDocumentRequest,
} from "./apiClient/documentApi.js";
import { logout as apiLogout } from "./apiClient/authApi.js";

document.addEventListener("DOMContentLoaded", () => {
  requireRole(["REGISTRAR"]);

  // --- Elements ---
  const firstNameEl = document.getElementById("navbar-firstname");
  const firstNameMobileEl = document.getElementById("navbar-firstname-mobile");
  const logoutBtn = document.getElementById("logout-btn");
  const logoutBtnMobile = document.getElementById("logout-btn-mobile");
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  // ✅ IMPORTANT: use existing tbody (no HTML changes)
  const tableBody = document.querySelector("#request-pool tbody");
  const acceptedTableBody = document.querySelector("#my-requests tbody");

  const sections = ["dashboard", "request-pool", "my-requests"];

  // --- Helpers ---
  const getFirstName = () => {
    const email = sessionStorage.getItem("email") ?? "";
    return email.split("@")[0] || "Registrar";
  };

  const getAuthToken = () =>
    sessionStorage.getItem("ntc_access_token");

  const logout = () => {
    apiLogout(
      sessionStorage.getItem("ntc_access_token"),
      localStorage.getItem("ntc_refresh_token")
    );
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "index.html";
  };

  // --- Navigation ---
  const navigateTo = (targetId) => {
    sections.forEach((id) => {
      const section = document.getElementById(id);
      if (section) {
        section.classList.toggle("hidden", id !== targetId);
      }
    });
  };

  // --- Navbar ---
  const firstName = getFirstName();
  if (firstNameEl) firstNameEl.textContent = firstName;
  if (firstNameMobileEl) firstNameMobileEl.textContent = firstName;

  // --- Nav click ---
  document.querySelectorAll(".nav-link, .nav-link-mobile").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      navigateTo(targetId);
      mobileMenu.classList.remove("open");
    });
  });

  // --- Logout ---
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
  if (logoutBtnMobile) logoutBtnMobile.addEventListener("click", logout);

  // --- Hamburger ---
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
    });
  }

  // --- Accept Request ---
  const handleAccept = async (req) => {
    const token = getAuthToken();
    if (!token) return;

    const registrarId = sessionStorage.getItem("userId");

    const payload = {
      id: req.id,
      purpose: req.purpose,
      documentType: req.documentType,
      documentId: req.documentId,
      additionalDetails: req.additionalDetails,
      remarks: "Accepted by registrar",
      status: "PROCESSING",
      studentId: req.studentId,
      registrarId: Number(registrarId),
    };

    console.log(payload);
    try {
      await acceptDocumentRequest(token, payload);
      alert("Request accepted!");
      loadPoolRequests(); // refresh pool
      loadAcceptedRequest(); // refresh my requests
    } catch (err) {
      alert("Error: " + err.message);
    }
  };
const loadAcceptedRequest = async () => {
    const token = getAuthToken();
    // Ensure this matches the ID in your <tbody> if you add one, or use a selector
    const acceptedTableBody = document.querySelector("#my-requests tbody");
    if (!token || !acceptedTableBody) return;

    try {
        const requests = await getRegistrarRequests(token);
        console.log(requests);

        acceptedTableBody.innerHTML = "";

        if (!requests || requests.length === 0) {
            acceptedTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-10 text-center text-gray-500 font-medium">
                        No accepted requests found.
                    </td>
                </tr>`;
            return;
        }

        requests.forEach((req) => {
            const row = document.createElement("tr");
            row.className = "hover:bg-gray-50 transition-colors";

            // 1. Handle Initials
            const initials = req.studentFullName
                ? req.studentFullName.split(" ").map(n => n[0]).join("").toUpperCase()
                : "??";
            
            // 2. Format Date
            const dateStr = req.requestedAt
                ? new Date(req.requestedAt).toLocaleString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric', 
                    hour: 'numeric', minute: '2-digit', hour12: true 
                  }).replace(',', ' ·')
                : "N/A";

            // 3. Payment Badge Logic (Assuming req.isPaid is a boolean)
            const paymentBadge = req.isPaid 
                ? `<span class="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Paid</span>`
                : `<span class="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">Unpaid</span>`;

            row.innerHTML = `
                <td class="px-5 py-4 text-gray-400 font-bold text-xs">#${req.id}</td>
                <td class="px-5 py-4 font-bold text-gray-700">${req.documentType}</td>
                <td class="px-5 py-4">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black flex-shrink-0">
                            ${initials}
                        </div>
                        <span class="font-bold text-gray-700">${req.studentFullName || "Unknown"}</span>
                    </div>
                </td>
                <td class="px-5 py-4 text-gray-500">${dateStr}</td>
                <td class="px-5 py-4">${paymentBadge}</td>
                <td class="px-5 py-4">
                    <div class="flex items-center gap-2">
                        <button class="approve-btn text-xs font-bold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg transition-all active:scale-95">Approve</button>
                        <button class="reject-btn text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-all active:scale-95">Reject</button>
                        <button class="view-btn text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-all active:scale-95">View</button>
                    </div>
                </td>
            `;

            // Add event listeners
            row.querySelector(".approve-btn").onclick = () => handleApprove(req);
            row.querySelector(".reject-btn").onclick = () => handleReject(req);
            row.querySelector(".view-btn").onclick = () => {
              openModal(
                req.id,
                req.documentType,
                req.studentFullName,
                initials,
                dateStr
              );
            };

            acceptedTableBody.appendChild(row);
        });
    } catch (err) {
        console.error("Fetch error:", err);
        alert("Error loading requests: " + err.message);
    }
};

  const handleApprove = async (rec) => {
    const token = getAuthToken();
    if (!token) return;
    const registrarId = sessionStorage.getItem("userId");
    const payload = {
      id: rec.id,
      status: "READY_FOR_RELEASE", // Standard status from DTO docstring
      remarks: "Approved and ready for release",
      registrarId: Number(registrarId),
    };
    console.log("Approving payload:", payload);
    try {
      await processDocumentRequest(token, payload);
      alert("Request approved and ready for release!");
      loadAcceptedRequest(); // refresh my requests
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleReject = async (rec) => {
    const token = getAuthToken();
    if (!token) return;
    const registrarId = sessionStorage.getItem("userId");
    const payload = {
      id: rec.id,
      status: "REJECTED",
      remarks: "Request rejected by registrar",
      registrarId: Number(registrarId),
    };
    console.log("Rejecting payload:", payload);
    try {
      await processDocumentRequest(token, payload);
      alert("Request rejected!");
      loadAcceptedRequest(); // refresh my requests
    } catch (err) {
      alert("Error: " + err.message);
    }
  };


  // --- Load Request Pool ---
  const loadPoolRequests = async () => {
    const token = getAuthToken();
    if (!token || !tableBody) return;

    try {
      const requests = await getPendingRequests(token);

      tableBody.innerHTML = "";

      if (!requests || requests.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="px-6 py-10 text-center text-gray-500">
              No pending requests found.
            </td>
          </tr>
        `;
        return;
      }

      requests.forEach((req) => {
        const row = document.createElement("tr");
        row.className = "hover:bg-gray-50 transition-colors";

        const initials = req.studentFullName
          ? req.studentFullName
              .split(" ")
              .map(n => n[0])
              .join("")
              .toUpperCase()
          : "S";

        const dateStr = req.requestedAt
          ? new Date(req.requestedAt).toLocaleString()
          : "N/A";

        row.innerHTML = `
          <td class="px-5 py-4 text-gray-400 font-bold text-xs">
            #${req.id}
          </td>

          <td class="px-5 py-4 font-bold text-gray-700">
            ${req.documentType}
          </td>

          <td class="px-5 py-4">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">
                ${initials}
              </div>
              <span class="font-bold text-gray-700">
                ${req.studentFullName || "Unknown"}
              </span>
            </div>
          </td>

          <td class="px-5 py-4 text-gray-500">
            ${dateStr}
          </td>

          <td class="px-5 py-4 text-right">
            <div class="flex justify-end gap-2">
              <button class="accept-btn text-sm font-bold text-white bg-green-500 hover:bg-green-600 px-4 py-1.5 rounded-lg">
                Accept
              </button>

              <button class="view-btn text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 px-4 py-1.5 rounded-lg">
                View
              </button>
            </div>
          </td>
        `;

        // Accept button
        row.querySelector(".accept-btn").onclick = () => handleAccept(req);

        // View button
        row.querySelector(".view-btn").onclick = () => {
          openModal(
            req.id,
            req.documentType,
            req.studentFullName,
            initials,
            dateStr
          );
        };

        tableBody.appendChild(row);
      });

    } catch (error) {
      console.error(error);
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-10 text-center text-red-500 font-bold">
            Error loading requests.
          </td>
        </tr>
      `;
    }
  };

  // --- Init ---
  navigateTo("dashboard");
  loadPoolRequests();
  loadAcceptedRequest();
});


// ✅ GLOBAL MODAL FUNCTIONS (required for HTML onclick)
window.openModal = (id, docType, name, initials, date) => {
  document.getElementById("modal-id").textContent = "#" + id;
  document.getElementById("modal-doctype").textContent = docType;
  document.getElementById("modal-name").textContent = name;
  document.getElementById("modal-avatar").textContent = initials;
  document.getElementById("modal-date").textContent = date;
  document.getElementById("modal-overlay").classList.remove("hidden");
};

window.closeModal = () => {
  document.getElementById("modal-overlay").classList.add("hidden");
};

window.handleOverlayClick = (e) => {
  if (e.target.id === "modal-overlay") {
    closeModal();
  }
};