import { apiRequest } from "./baseClient.js";

function withAuth(token, options = {}) {
  return {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  };
}

export function getStudentDocuments(token) {
  return apiRequest("/api/document/student", withAuth(token, { method: "GET" }));
}

export function getStudentRequests(token) {
  return apiRequest("/api/document-request/student", withAuth(token, { method: "GET" }));
}

export function getRequestLogs(token, documentRequestId) {
  return apiRequest(
    `/api/document-request/logs/${documentRequestId}`,
    withAuth(token, { method: "GET" })
  );
}

export function submitDocumentRequest(token, payload) {
  return apiRequest(
    "/api/document-request/submit",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  );
}
