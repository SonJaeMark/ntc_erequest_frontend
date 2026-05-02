import {
  getAllUnacceptedRequests,
  acceptDocumentRequest,
} from "./apiClient/documentApi.js";
import { logout as apiLogout } from "./apiClient/authApi.js";

document.addEventListener("DOMContentLoaded", async () => {
    // --- Auth guard: requires REGISTRAR role ---
    // requireRole(["REGISTRAR"]);

    const firstNameEl = document.getElementById("navbar-firstname");
    const firstNameMobileEl = document.getElementById("navbar-firstname-mobile");
    const logoutBtn = document.getElementById("logout-btn");
    const logoutBtnMobile = document.getElementById("logout-btn-mobile");
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    const cancelBtn = document.getElementById("cancel-btn");

    const sections = ['dashboard', 'request-pool', 'my-requests'];

    const getFirstName = () => {
        const email = sessionStorage.getItem("email") ?? "";
        return email.split("@")[0] ?? "Registrar";
    };

    const getAuthToken = () => sessionStorage.getItem("ntc_access_token");

    const logout = async () => {
        try {
            const token = getAuthToken();
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

    const navigateTo = (targetId) => {
        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) {
                section.classList.toggle('hidden', id !== targetId);
            }
        });

        document.querySelectorAll('.nav-link').forEach(navLink => {
            const linkTarget = navLink.getAttribute('href').substring(1);
            if (linkTarget === targetId) {
                navLink.className = "nav-link text-sm font-bold text-blue-600 border-b-2 border-blue-600 pb-0.5";
            } else {
                navLink.className = "nav-link text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors";
            }
        });

        document.querySelectorAll('.nav-link-mobile').forEach(navLink => {
            const linkTarget = navLink.getAttribute('href').substring(1);
            if (linkTarget === targetId) {
                navLink.className = "nav-link-mobile text-sm font-bold text-blue-600 bg-blue-50 px-2 py-2 rounded-lg";
            } else {
                navLink.className = "nav-link-mobile text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-gray-50 px-2 py-2 rounded-lg transition-colors";
            }
        });
    };

    const firstName = getFirstName();
    if (firstNameEl) firstNameEl.textContent = firstName;
    if (firstNameMobileEl) firstNameMobileEl.textContent = firstName;

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.getAttribute('href').substring(1));
        });
    });

    document.querySelectorAll('.nav-link-mobile').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.getAttribute('href').substring(1));
            mobileMenu.classList.remove('open');
        });
    });

    if (logoutBtn) logoutBtn.addEventListener("click", logout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener("click", logout);

    if (cancelBtn) cancelBtn.addEventListener("click", () => navigateTo('dashboard'));

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener("click", () => {
            mobileMenu.classList.toggle("open");
        });
    }

    navigateTo('dashboard');

    window.addEventListener("navigateTo", (e) => {
        navigateTo(e.detail.section);
    });

    // --- REQUEST POOL MODAL ---
    let currentPoolRequest = null;

    window.openPoolModal = function(id, docType, name, initials, date, requestData) {
        currentPoolRequest = requestData;
        document.getElementById('pool-modal-id').textContent = '#' + id;
        document.getElementById('pool-modal-doctype').textContent = docType;
        document.getElementById('pool-modal-name').textContent = name;
        document.getElementById('pool-modal-avatar').textContent = initials;
        document.getElementById('pool-modal-date').textContent = date;
        document.getElementById('modal-pool-overlay').classList.remove('hidden');
    };

    window.closePoolModal = function() {
        currentPoolRequest = null;
        document.getElementById('modal-pool-overlay').classList.add('hidden');
    };

    const poolModalAcceptBtn = document.getElementById('pool-modal-accept-btn');
    if (poolModalAcceptBtn) {
        poolModalAcceptBtn.onclick = async () => {
            if (currentPoolRequest) {
                await handleAccept(currentPoolRequest);
                window.closePoolModal();
            }
        };
    }

    document.getElementById('modal-pool-overlay').addEventListener('click', function(e) {
        if (e.target === this) window.closePoolModal();
    });

    // --- MY REQUESTS MODAL ---
    window.openRequestsModal = function(id, docType, name, initials, date, paymentStatus, paymentId, amount, paidAt, referenceNumber) {
        document.getElementById('req-modal-id').textContent = '#' + id;
        document.getElementById('req-modal-doctype').textContent = docType;
        document.getElementById('req-modal-name').textContent = name;
        document.getElementById('req-modal-avatar').textContent = initials;
        document.getElementById('req-modal-date').textContent = date;

        const statusEl = document.getElementById('req-modal-payment-status');
        const detailsEl = document.getElementById('req-modal-payment-details');

        if (paymentStatus === 'paid') {
            statusEl.innerHTML = '<span class="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Paid</span>';
            detailsEl.classList.remove('hidden');
            document.getElementById('req-modal-payment-id').textContent = paymentId;
            document.getElementById('req-modal-amount').textContent = amount;
            document.getElementById('req-modal-paid-at').textContent = paidAt;
            document.getElementById('req-modal-reference').textContent = referenceNumber;
        } else {
            statusEl.innerHTML = '<span class="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">Unpaid</span>';
            detailsEl.classList.add('hidden');
        }

        document.getElementById('modal-requests-overlay').classList.remove('hidden');
    };

    window.closeRequestsModal = function() {
        document.getElementById('modal-requests-overlay').classList.add('hidden');
    };

    document.getElementById('modal-requests-overlay').addEventListener('click', function(e) {
        if (e.target === this) window.closeRequestsModal();
    });

    const handleAccept = async (request) => {
        const token = getAuthToken();
        if (!token) {
            console.error("No auth token found!");
            return;
        }

        const registrarId = sessionStorage.getItem("userId");
        console.log("#############registrarId:", registrarId);
        const requestId = request.id || request.docrequestid;
        console.log("#############requestId:", requestId);
        
        if (!registrarId) {
            console.error("No registrarId (userId) found in sessionStorage!");
            alert("Session error. Please log in again.");
            return;
        }
        
        // Prepare payload based on the Java DocumentRequestRequestDTO
        const payload = {
            id: requestId, 
            purpose: request.purpose,
            documentType: request.documentType,
            documentId: request.documentId,
            additionalDetails: request.additionalDetails || "",
            remarks: "Request accepted by registrar",
            status: "PROCESSING",
            studentId: request.studentId,
            registrarId: Number(registrarId)
        };

        console.log("=== ACCEPT ACTION START ===");
        console.log("Target Request ID:", requestId);
        console.log("Payload being sent:", payload);

        try {
            const response = await acceptDocumentRequest(token, payload);
            console.log("Accept API Response:", response);
            
            alert("Request accepted successfully!");
            
            // Refresh data from server
            console.log("Refreshing pool from server...");
            const freshData = await getAllUnacceptedRequests(token);
            console.log("Fresh Pool Data (all unaccepted):");
            console.table(freshData);
            
            renderRequestPool(freshData);
        } catch (error) {
            console.error("Error accepting request:", error);
            alert("Failed to accept request: " + error.message);
        }
    };

    function renderRequestPool(data) {
        console.log("=== RENDERING POOL DEBUG ===");
        console.log("Data to render:", data);
        
        const tbody = document.getElementById('document-table-body');
        if (!tbody) {
            console.error("Table body 'document-table-body' not found!");
            return;
        }
        
        tbody.innerHTML = '';

        if (!data || data.length === 0) {
            console.log("Pool is empty.");
            tbody.innerHTML = '<tr><td colspan="5" class="px-5 py-10 text-center text-gray-500">No pending requests found.</td></tr>';
            return;
        }

        data.forEach(item => {
            const initials = item.studentFullName
                ? item.studentFullName.split(' ').map(n => n[0]).join('').toUpperCase()
                : '??';

            const date = new Date(item.requestedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }).replace(',', ' ·');

            const row = document.createElement('tr');
            row.className = "hover:bg-gray-50 transition-colors";
            row.innerHTML = `
                <td class="px-5 py-4 text-gray-400 font-bold text-xs">#REQ-${item.id}</td>
                <td class="px-5 py-4 font-bold text-gray-700">${item.documentType}</td>
                <td class="px-5 py-4">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black flex-shrink-0">${initials}</div>
                        <span class="font-bold text-gray-700">${item.studentFullName}</span>
                    </div>
                </td>
                <td class="px-5 py-4 text-gray-500">${date}</td>
                <td class="px-5 py-4">
                    <div class="flex items-center gap-2">
                        <button class="accept-btn text-sm font-bold text-white bg-green-500 hover:bg-green-600 px-4 py-1.5 rounded-lg transition-all active:scale-95">Accept</button>
                        <button class="view-btn text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 px-4 py-1.5 rounded-lg transition-all active:scale-95">View</button>
                    </div>
                </td>
            `;
            
            row.querySelector('.accept-btn').onclick = () => handleAccept(item);
            row.querySelector('.view-btn').onclick = () => window.openPoolModal(item.id, item.documentType, item.studentFullName, initials, date, item);
            
            tbody.appendChild(row);
        });
    }

    // INITIAL LOAD
    const token = getAuthToken();
    if (token) {
        try {
            console.log("=== INITIAL POOL LOAD ===");
            const requestPool = await getAllUnacceptedRequests(token);
            console.log("Initial Pool Data received:");
            console.table(requestPool);
            renderRequestPool(requestPool);
        } catch (error) {
            console.error("Error loading pool requests:", error);
        }
    }

});