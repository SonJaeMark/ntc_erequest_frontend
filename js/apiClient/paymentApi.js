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

/**
 * Payment API methods.
 */

/**
 * Processes a payment for a document request.
 * @param {string} token - JWT access token.
 * @param {Object} data - PaymentRequestDTO
 * @param {string} data.paymentMethod - (PaymentMethod enum) e.g., "CASH", "GCASH", "PAYMAYA"
 * @param {number} data.documentRequestId - ID of the document request
 * @param {string} [data.referenceNumber] - Required for non-CASH methods
 * @returns {Promise} - PaymentResponseDTO
 * @example
 * // Sample Response (PaymentResponseDTO):
 * // {
 * //   "paymentId": 50,
 * //   "isPaid": true,
 * //   "amount": 120.0,
 * //   "paidAt": "2026-05-04T10:00:00",
 * //   "documentRequestId": 10,
 * //   "validated": false,
 * //   "referenceNumber": "CASH-A1B2C3D4"
 * // }
 */
export function processPayment(token, data) {
  return apiRequest("/api/payments", withAuth(token, {
    method: "POST",
    body: JSON.stringify(data)
  }));
}

/**
 * Registrar: Lists all payments pending validation.
 * @param {string} token - JWT access token.
 * @returns {Promise} - List of PaymentResponseDTO objects.
 */
export function getPendingPayments(token) {
  return apiRequest("/api/payments/pending", withAuth(token, { method: "GET" }));
}

/**
 * Checks the payment status for a specific document request ID.
 * @param {string} token - JWT access token.
 * @param {number} documentRequestId - ID of the document request to check.
 * @returns {Promise} - PaymentResponseDTO
 */
export function checkPayment(token, documentRequestId) {
  return apiRequest(`/api/payments/check-payment/${documentRequestId}`, withAuth(token, { method: "GET" }));
}