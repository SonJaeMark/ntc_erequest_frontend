document.addEventListener("DOMContentLoaded", async () => {
  const AUTH_TOKEN_KEY = "ntc_access_token";
  const BASE_URL = "https://ntc-erquest-system-1.onrender.com";
  const form = document.getElementById("document-request-form");

  if (!form) {
    console.error("Form element with id 'document-request-form' not found in the DOM");
    alert("Error: Form not found. Please refresh the page.");
    return;
  }

  const getAuthToken = () => sessionStorage.getItem(AUTH_TOKEN_KEY);

  let documentMap = {}; // Store mapping of documentType -> document info

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
        headers: {
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
              studentFullName: doc.studentFullName
            };
          }
        });

        // Get unique document types
        const uniqueTypes = Object.keys(documentMap);

        // Populate the select
        documentTypeSelect.innerHTML = '<option value="" disabled selected>Select document type</option>';
        uniqueTypes.forEach(type => {
          const option = document.createElement("option");
          option.value = type;
          option.textContent = type.replace(/_/g, " ");
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

  /**
   * Handle form submission to create document request
   */
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Get form values
    const purpose = document.getElementById("purpose").value;
    const documentType = document.getElementById("documentType").value;
    const additionalDetails = document.getElementById("additionalDetails").value.trim();

    // Validate document type selection
    const documentId = documentMap[documentType]?.id;
    if (!documentId) {
      alert("Please select a valid document type");
      return;
    }

    // Get user info from session storage
    const studentId = sessionStorage.getItem("userId");
    if (!studentId) {
      alert("Session error. Please log in again.");
      window.location.href = "index.html";
      return;
    }

    try {
      const token = getAuthToken();
      
      // Debug: Check token status
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

      // Build request payload according to spec
      const requestBody = {
        purpose,
        documentType,
        documentId,
        additionalDetails,
        remarks: "",
        status: "PENDING",
        studentId: Number(studentId),
        registrarId: 0
      };

      console.log("Request payload:", requestBody);

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };
      
      console.log("Request headers:");
      console.log("  Content-Type:", headers["Content-Type"]);
      console.log("  Authorization:", headers["Authorization"].substring(0, 40) + "...");

      const response = await fetch(`${BASE_URL}/api/document-request/submit`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} - ${text}`);
      }

      const data = text ? JSON.parse(text) : null;
      const requestId = data?.requestId ?? data?.id ?? data?.data?.requestId ?? null;

      if (requestId) {
        console.log("Request submitted successfully. Request ID:", requestId);
        alert("Document request submitted successfully!");
        window.location.href = "student-dashboard.html";
      } else {
        throw new Error("No request ID returned by API");
      }
    } catch (error) {
      console.error("Error submitting request:", error.message);
      alert("Failed to submit request: " + error.message);
    }
  });
});