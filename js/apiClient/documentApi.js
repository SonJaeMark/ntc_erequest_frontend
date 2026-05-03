import { apiRequest } from "./baseClient.js";

/**
 * Helper function to inject Authorization header into request options.
 */
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

// ==========================================
// Document Endpoints
// ==========================================

/**
 * Retrieves the list of uploaded documents for the authenticated student.
 * @param {string} token - JWT access token.
 * @returns {Promise} - List of DocumentResponseDTO objects.
 * @example
 * // Sample Response (DocumentResponseDTO):
 * // [
 * //   {
 * //     "id": 1,
 * //     "uploadedAt": "2026-05-01T12:00:00",
 * //     "documentType": "TOR",
 * //     "documentContent": "base64...",
 * //     "studentId": 5,
 * //     "studentFullName": "Charlie Brown"
 * //   }
 * // ]
 */
export function getStudentDocuments(token) {
  return apiRequest("/api/document/student", withAuth(token, { method: "GET" }));
}

// ==========================================
// Document Request Endpoints
// ==========================================

/**
 * Submits a new document request.
 * @param {string} token - JWT access token.
 * @param {Object} data - DocumentRequestRequestDTO
 * @param {string} data.purpose - (Purpose enum) e.g., "EMPLOYMENT", "SCHOLARSHIP"
 * @param {string} data.documentType - (DocumentType enum) e.g., "TOR", "DIPLOMA"
 * @param {number} data.documentId - ID of the Document entity
 * @param {string} [data.additionalDetails] - Optional details from student
 * @param {number} data.studentId - ID of the student user
 * @returns {Promise} - DocumentRequestResponseDTO
 * @example
 * // Sample Response (DocumentRequestResponseDTO):
 * // {
 * //   "id": 10,
 * //   "purpose": "EMPLOYMENT",
 * //   "documentType": "TOR",
 * //   "documentId": 1,
 * //   "additionalDetails": "Need for work",
 * //   "remarks": null,
 * //   "status": "PENDING",
 * //   "requestedAt": "2026-05-04T08:00:00",
 * //   "updatedAt": "2026-05-04T08:00:00",
 * //   "studentId": 5,
 * //   "studentFullName": "Charlie Brown",
 * //   "registrarId": null
 * // }
 */
export function submitDocumentRequest(token, data) {
  return apiRequest("/api/document-request/submit", withAuth(token, {
    method: "POST",
    body: JSON.stringify(data)
  }));
}

/**
 * Processes a document request (Update status/remarks).
 * @param {string} token - JWT access token.
 * @param {Object} data - DocumentRequestRequestDTO
 * @param {number} data.id - ID of the request to process
 * @param {string} data.status - (RequestStatus enum) e.g., "READY_FOR_RELEASE"
 * @param {string} [data.remarks] - Registrar remarks
 * @returns {Promise} - DocumentRequestResponseDTO
 */
export function processDocumentRequest(token, data) {
  return apiRequest("/api/document-request/process", withAuth(token, {
    method: "PUT",
    body: JSON.stringify(data)
  }));
}

/**
 * Accepts a document request (Changes status to PROCESSING).
 * @param {string} token - JWT access token.
 * @param {Object} data - DocumentRequestRequestDTO
 * @param {number} data.id - ID of the request to accept
 * @param {number} data.registrarId - ID of the registrar accepting the request
 * @returns {Promise} - DocumentRequestResponseDTO
 */
export function acceptDocumentRequest(token, data) {
  return apiRequest("/api/document-request/accept", withAuth(token, {
    method: "PUT",
    body: JSON.stringify(data)
  }));
}

/**
 * Cancels a pending document request.
 * @param {string} token - JWT access token.
 * @param {number} documentRequestId - The ID of the request to cancel.
 * @returns {Promise} - DocumentRequestResponseDTO
 */
export function cancelDocumentRequest(token, documentRequestId) {
  return apiRequest(`/api/document-request/cancel/${documentRequestId}`, withAuth(token, {
    method: "PUT"
  }));
}

/**
 * Retrieves all document requests for the authenticated student.
 * @param {string} token - JWT access token.
 * @returns {Promise} - List of DocumentRequestResponseDTO objects.
 */
export function getStudentRequests(token) {
  return apiRequest("/api/document-request/student", withAuth(token, { method: "GET" }));
}

/**
 * Retrieves all requests handled by the authenticated registrar.
 * @param {string} token - JWT access token.
 * @returns {Promise} - List of DocumentRequestResponseDTO objects.
 */
export function getRegistrarRequests(token) {
  return apiRequest("/api/document-request/registrar", withAuth(token, { method: "GET" }));
}

/**
 * Retrieves all pending document requests.
 * @param {string} token - JWT access token.
 * @returns {Promise} - List of DocumentRequestResponseDTO objects.
 */
export function getPendingRequests(token) {
  return apiRequest("/api/document-request/pending", withAuth(token, { method: "GET" }));
}

/**
 * Retrieves history for a specific request.
 * @param {string} token - JWT access token.
 * @param {number} documentRequestId - The ID of the document request.
 * @returns {Promise} - List of RequestLogsResponseDTO objects.
 * @example
 * // Sample Response (RequestLogsResponseDTO):
 * // [
 * //   {
 * //     "id": 1,
 * //     "requestStatus": "PENDING",
 * //     "dateAction": "2026-05-04T08:00:00",
 * //     "remarks": "Request submitted"
 * //   }
 * // ]
 */
export function getRequestLogs(token, documentRequestId) {
  return apiRequest(`/api/document-request/logs/${documentRequestId}`, withAuth(token, { method: "GET" }));
}
