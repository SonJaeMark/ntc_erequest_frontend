document.addEventListener("DOMContentLoaded", async () => {
  const AUTH_TOKEN_KEY = "ntc_access_token";
  const form = document.getElementById("document-request-form");

  if (!form) {
    console.error("Form element with id 'document-request-form' not found in the DOM");
    alert("Error: Form not found. Please refresh the page.");
    return;
  }

  const getAuthToken = () => {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    console.log("getAuthToken() called - returning:", token ? token.substring(0, 20) + "..." : "null");
    return token;
  };

  // Debug: Log everything on page load
  console.log("=== PAGE LOAD DEBUG ===");
  console.log("sessionStorage contents:");
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const value = sessionStorage.getItem(key);
    console.log(`  ${key}:`, value?.substring ? value.substring(0, 50) + (value.length > 50 ? "..." : "") : value);
  }
  console.log("=== END PAGE LOAD DEBUG ===\n");

  const getRequestIdFromResponse = (data) => {
    return (
      data?.requestId ??
      data?.id ??
      data?.data?.requestId ??
      data?.documentRequest?.id ??
      null
    );
  };

  let documentMap = {}; // Store mapping of documentType -> {id, fullName}

  const loadDocumentTypes = async () => {
    try {
      const token = getAuthToken();
      
      console.log("loadDocumentTypes() - Token exists:", !!token);
      console.log("Token length:", token?.length);
      console.log("Token value (FULL):", token);
      
      if (!token) {
        console.error("No auth token found in sessionStorage");
        alert("Session expired. Please log in again.");
        window.location.href = "index.html";
        return;
      }

      const authHeader = `Bearer ${token}`;
      console.log("Authorization header (FULL):", authHeader);
      console.log("Authorization header includes 'Bearer':", authHeader.includes("Bearer"));

      console.log("Constructing fetch with headers:");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      };
      console.log("Headers object:", JSON.stringify(headers));

      const response = await fetch(
        "https://ntc-erquest-system-1.onrender.com/api/document/student",
        {
          method: "GET",
          headers: headers,
        }
      );
      
      console.log("Response status:", response.status, "OK:", response.ok);
      console.log("Response headers - Authorization sent?", "Check Network tab");
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        alert(`Failed to load documents: ${response.status} ${response.statusText}\n\n${errorText}`);
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
        
        // Extract unique document types
        const uniqueTypes = Object.keys(documentMap);
        
        // Clear existing options except the placeholder
        documentTypeSelect.innerHTML = '<option value="" disabled selected>Select document type</option>';
        
        // Add options for each unique document type
        uniqueTypes.forEach(type => {
          const option = document.createElement("option");
          option.value = type;
          option.textContent = type.replace(/_/g, " ");
          documentTypeSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Error loading document types:", error);
    }
  };

  await loadDocumentTypes();

  const handleSuccessResponse = (requestId) => {
    if (requestId) {
      console.log("Request submitted successfully. Request ID:", requestId);
      window.location.href = "student-dashboard.html";
      return;
    }
    throw new Error(`No request ID returned by API: ${requestId ?? "empty response"}`);
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const purpose = document.getElementById("purpose").value;
    const documentType = document.getElementById("documentType").value;
    const additionalDetails = document.getElementById("additionalDetails").value.trim();
    const remarks = "";
    const userId = sessionStorage.getItem("userId");

    // Get documentId from the documentMap based on selected documentType
    const documentId = documentMap[documentType]?.id;

    if (!documentId) {
      console.error("Selected document type has no associated document ID");
      alert("Please select a valid document type");
      return;
    }

    console.log("\n=== FORM SUBMISSION ===");
    console.log("Purpose:", purpose);
    console.log("Document Type:", documentType);
    console.log("Document ID:", documentId);
    console.log("User ID:", userId);
    console.log("Stored token:", sessionStorage.getItem("ntc_access_token")?.substring(0, 20) + "...");
    console.log("Stored role:", sessionStorage.getItem("role"));
    console.log("=== END SUBMISSION DEBUG ===\n");

    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error("No auth token found. Please log in again.");
      }

      const authHeader = `Bearer ${token}`;
      const requestBody = { purpose, documentType, documentId, additionalDetails, remarks };
      
      console.log("Sending POST to submit endpoint with body:", requestBody);
      console.log("Authorization header preview:", authHeader.substring(0, 30) + "...");

      const response = await fetch(
        "https://ntc-erquest-system-1.onrender.com/api/document-request/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Request submission failed: ${response.status} - ${text}`);
      }

      console.log("Submission success:", text);

      const data = text ? JSON.parse(text) : null;
      const requestId = getRequestIdFromResponse(data);
      console.log("Request ID:", requestId, "Full response:", data);

      handleSuccessResponse(requestId);

      return data;
    } catch (error) {
      console.error("Error submitting request:", error.message, error);
      alert("Failed to submit request: " + error.message);
    }
  });
});