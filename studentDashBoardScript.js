document.addEventListener("DOMContentLoaded", () => {
  const AUTH_TOKEN_KEY = "ntc_access_token";
  const form = document.getElementById("document-request-form");

  const getAuthToken = () => sessionStorage.getItem(AUTH_TOKEN_KEY);

  const getRequestIdFromResponse = (data) => {
    return (
      data?.requestId ??
      data?.id ??
      data?.data?.requestId ??
      data?.documentRequest?.id ??
      null
    );
  };

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

    const documentId = Number(document.getElementById("documentId").value.trim());
    const purpose = document.getElementById("purpose").value;
    const documentType = document.getElementById("documentType").value;
    const additionalDetails = document.getElementById("additionalDetails").value.trim();
    const remarks = "";
    const status = "";
    const userId = sessionStorage.getItem("userId");
    const registrarId = 1;

      console.log("accessToken:", sessionStorage.getItem("ntc_access_token"));
      console.log("role:", sessionStorage.getItem("role"));
      console.log("userId:", sessionStorage.getItem("userId"));

    try {
      
      const token = getAuthToken();
      console.log("Auth token:", token);

      if (!token) {
        throw new Error("No auth token found. Please log in again.");
      }

      console.log("Submitting request for document ID:", documentId, userId, registrarId);

      const response = await fetch(
        "https://ntc-erquest-system-1.onrender.com/api/document-request/submit",
        {
          method: "POST",
          credentials: "include", // important for cookies
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ purpose, documentType, documentId, additionalDetails, remarks, status }),
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
    }
  });
});