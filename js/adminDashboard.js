import { registerUser, toggleUserActiveStatus, getAllUsers } from './apiClient/userManagementApi.js';
import { saveStudentDocument } from './apiClient/documentApi.js';

const getAuthToken = () => sessionStorage.getItem("ntc_access_token");

let allUsers = [];

// ── TAB SWITCHING ──
window.switchTab = function(tab) {
    // Hide all panels
    ['register', 'acc-status'].forEach(t => {
        document.getElementById('panel-' + t).classList.add('hidden');

        // Desktop sidebar buttons
        const dBtn = document.getElementById('tab-btn-' + t);
        if (dBtn) dBtn.className =
            'flex items-center gap-2.5 text-sm font-bold px-3 py-2.5 rounded-lg transition-all text-gray-500 hover:bg-gray-100 w-full text-left';

        // Mobile tab buttons
        const mBtn = document.getElementById('tab-btn-' + t + '-mobile');
        if (mBtn) mBtn.className =
            'flex-1 flex items-center justify-center gap-2 text-sm font-bold px-4 py-3 transition-all text-gray-500 border-b-2 border-transparent';
    });

    // Show active panel
    document.getElementById('panel-' + tab).classList.remove('hidden');

    // Activate desktop button
    const dActive = document.getElementById('tab-btn-' + tab);
    if (dActive) dActive.className =
        'flex items-center gap-2.5 text-sm font-bold px-3 py-2.5 rounded-lg transition-all bg-blue-600 text-white w-full text-left';

    // Activate mobile button
    const mActive = document.getElementById('tab-btn-' + tab + '-mobile');
    if (mActive) mActive.className =
        'flex-1 flex items-center justify-center gap-2 text-sm font-bold px-4 py-3 transition-all text-blue-600 border-b-2 border-blue-600';

    if (tab === 'acc-status') loadAccounts();
}

// ── REGISTER FORM ──
function showError(inputId, msgId) {
    const el = document.getElementById(inputId);
    el.classList.add('border-red-400', 'ring-2', 'ring-red-300');
    el.classList.remove('border-gray-200');
    document.getElementById(msgId).classList.remove('hidden');
}

window.clearError = function(inputId) {
    const el = document.getElementById(inputId);
    el.classList.remove('border-red-400', 'ring-2', 'ring-red-300');
    el.classList.add('border-gray-200');
    const errEl = document.getElementById('err-' + inputId.replace('reg-', ''));
    if (errEl) errEl.classList.add('hidden');
}

window.submitRegister = async function() {
    const fn = document.getElementById('reg-firstname').value.trim();
    const ln = document.getElementById('reg-lastname').value.trim();
    const em = document.getElementById('reg-email').value.trim();
    const pw = document.getElementById('reg-password').value;
    const rl = document.getElementById('reg-role').value;

    let valid = true;

    if (!fn) { showError('reg-firstname', 'err-firstname'); valid = false; }
    if (!ln) { showError('reg-lastname', 'err-lastname'); valid = false; }
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { showError('reg-email', 'err-email'); valid = false; }
    if (!pw || pw.length < 6) { showError('reg-password', 'err-password'); valid = false; }
    if (!rl) { showError('reg-role', 'err-role'); valid = false; }

    if (!valid) return;

    const payload = {
        firstName: fn,
        lastName: ln,
        email: em,
        password: pw,
        confirmPassword: pw,
        role: rl
        };

        const token = getAuthToken();

        try {
            await registerUser(payload, token);
            alert(`User ${fn} ${ln} registered as ${rl}!`);
            cancelRegister();
        } catch (err) {
            console.error("Registration error:", err);
            alert("Error registering user: " + err.message);
        }
    }

window.cancelRegister = function() {
    ['reg-firstname','reg-lastname','reg-email','reg-password'].forEach(id => {
        document.getElementById(id).value = '';
        window.clearError(id);
    });
    document.getElementById('reg-role').value = '';
    window.clearError('reg-role');
}

// ── RENDER ACCOUNTS ──
async function loadAccounts() {
    const token = getAuthToken();
    if (!token) return;

    try {
        allUsers = await getAllUsers(token);
        renderAccounts();
    } catch (err) {
        console.error("Error loading users:", err);
        // alert("Error loading users: " + err.message);
    }
}

window.renderAccounts = function() {
    const search   = document.getElementById('acc-search').value.toLowerCase();
    const role     = document.getElementById('acc-role-filter').value;
    const emptyEl  = document.getElementById('acc-empty');
    const wrapUsers = document.getElementById('wrap-users');
    const tbody    = document.getElementById('acc-tbody');

    tbody.innerHTML = '';
    emptyEl.classList.add('hidden');

    const filtered = allUsers.filter(u => {
        const name = (u.fullName || "").toLowerCase();
        const matchesSearch = name.includes(search) || u.email.toLowerCase().includes(search);
        const matchesRole = u.role === role;
        return matchesSearch && matchesRole;
    });

    if (!filtered.length) {
        emptyEl.classList.remove('hidden');
        wrapUsers.classList.add('hidden');
        return;
    }

    wrapUsers.classList.remove('hidden');

    filtered.forEach(u => {
        // Generate initials from fullName
        const nameParts = (u.fullName || "User").split(" ");
        const initials = nameParts.length > 1 
            ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
            : nameParts[0].substring(0, 2).toUpperCase();

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition-colors';
        
        // Use a consistent avatar background color
        const avatarBg = u.role === 'STUDENT' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700';
        
        tr.innerHTML = `
            <td class="px-5 py-4 text-gray-400 font-bold text-xs whitespace-nowrap">#${u.userId}</td>
            <td class="px-5 py-4 text-gray-500 truncate">${u.email}</td>
            <td class="px-5 py-4">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center text-xs font-black flex-shrink-0">${initials}</div>
                    <div class="flex flex-col">
                        <span class="font-bold text-gray-700 truncate">${u.fullName}</span>
                    </div>
                </div>
            </td>
            <td class="px-5 py-4">
                <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">${u.role}</span>
            </td>
            <td class="px-5 py-4">
                <div class="flex items-center gap-2">
                    ${u.role === 'STUDENT' ? `
                        <button onclick="openUploadModal(${u.userId}, '${u.fullName}')" 
                            class="text-[10px] font-bold text-white bg-blue-500 hover:bg-blue-600 px-2 py-1.5 rounded-lg transition-all active:scale-95 whitespace-nowrap">
                            Upload Doc
                        </button>` : ''}
                    <button data-id="${u.userId}"
                        onclick="toggleStatus(this)"
                        class="action-btn text-xs font-bold text-white py-1.5 rounded-lg transition-all active:scale-95 ${u.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}">
                        ${u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.filterAccounts = function() { window.renderAccounts(); }

// ── TOGGLE ACTIVATE / DEACTIVATE ──
window.toggleStatus = async function(btn) {
    const token = getAuthToken();
    if (!token) return;

    const id = parseInt(btn.dataset.id);
    const isDeactivateAction = btn.textContent.trim() === 'Deactivate';

    try {
        const newStatus = await toggleUserActiveStatus(token, id);
        
        // Update local data
        const user = allUsers.find(u => u.userId === id);
        if (user) user.isActive = newStatus;

        // Update UI button
        btn.textContent = newStatus ? 'Deactivate' : 'Activate';
        btn.className = `action-btn text-xs font-bold text-white py-1.5 rounded-lg transition-all active:scale-95 ${newStatus ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`;
        
        // Update status badge (need to re-render or find it)
        window.renderAccounts();
    } catch (err) {
        console.error("Error toggling status:", err);
        alert("Error toggling user status: " + err.message);
    }
}

// ── DOCUMENT UPLOAD ──
window.openUploadModal = function(studentId, studentName) {
    const modal = document.getElementById('upload-doc-modal');
    const info  = document.getElementById('upload-student-info');
    const idInp = document.getElementById('upload-student-id');
    const type  = document.getElementById('upload-doc-type');
    const cont  = document.getElementById('upload-doc-content');

    if (!modal) return;

    // Reset fields
    idInp.value = studentId;
    type.value = "";
    cont.value = "";
    info.textContent = `Student: #${studentId} - ${studentName}`;

    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

window.closeUploadModal = function() {
    const modal = document.getElementById('upload-doc-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }
}

window.submitUploadDocument = async function() {
    const id      = document.getElementById('upload-student-id').value;
    const type    = document.getElementById('upload-doc-type').value;
    const content = document.getElementById('upload-doc-content').value.trim();
    const btn     = document.getElementById('upload-submit-btn');

    if (!type) { alert("Please select a document type."); return; }
    if (!content) { alert("Please enter document content or a link."); return; }

    const token = getAuthToken();
    const payload = {
        documentType: type,
        documentContent: content,
        studentId: parseInt(id)
    };

    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
        await saveStudentDocument(token, payload);
        alert("Document saved successfully!");
        window.closeUploadModal();
    } catch (err) {
        console.error("Upload error:", err);
        alert("Error saving document: " + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "Save Document";
    }
}

window.initUserManagement = function() { window.switchTab('register'); }

// ── NAV, AUTH, LOGOUT ──
document.addEventListener("DOMContentLoaded", () => {
    // --- Auth guard: requires ADMIN role ---
    if (!requireRole(["ADMIN"])) return;

    const firstNameEl       = document.getElementById("navbar-firstname");
    const firstNameMobileEl = document.getElementById("navbar-firstname-mobile");
    const logoutBtn         = document.getElementById("logout-btn");
    const logoutBtnMobile   = document.getElementById("logout-btn-mobile");
    const hamburgerBtn      = document.getElementById("hamburger-btn");
    const mobileMenu        = document.getElementById("mobile-menu");
    const sections          = ['dashboard', 'user-management'];

    const getFirstName = () => {
        const email = sessionStorage.getItem("email") ?? "";
        return email.split("@")[0] || "Admin";
    };

    const logout = () => {
        sessionStorage.clear(); localStorage.clear();
        window.location.href = "index.html";
    };

    const navigateTo = (targetId) => {
        sections.forEach(id => {
            const s = document.getElementById(id);
            if (s) s.classList.toggle('hidden', id !== targetId);
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            const t = link.getAttribute('href').substring(1);
            link.className = t === targetId
                ? "nav-link text-sm font-bold text-blue-600 border-b-2 border-blue-600 pb-0.5"
                : "nav-link text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors";
        });

        document.querySelectorAll('.nav-link-mobile').forEach(link => {
            const t = link.getAttribute('href').substring(1);
            link.className = t === targetId
                ? "nav-link-mobile text-sm font-bold text-blue-600 bg-blue-50 px-2 py-2 rounded-lg"
                : "nav-link-mobile text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-gray-50 px-2 py-2 rounded-lg transition-colors";
        });

        if (targetId === 'user-management') window.initUserManagement();
    };

    const firstName = getFirstName();
    if (firstNameEl) firstNameEl.textContent = firstName;
    if (firstNameMobileEl) firstNameMobileEl.textContent = firstName;

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => { e.preventDefault(); navigateTo(link.getAttribute('href').substring(1)); });
    });

    document.querySelectorAll('.nav-link-mobile').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            navigateTo(link.getAttribute('href').substring(1));
            mobileMenu.classList.remove('open');
        });
    });

    if (logoutBtn) logoutBtn.addEventListener("click", logout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener("click", logout);
    if (hamburgerBtn) hamburgerBtn.addEventListener("click", () => mobileMenu.classList.toggle("open"));

    navigateTo('dashboard');
    window.addEventListener("navigateTo", e => navigateTo(e.detail.section));
});
