
// api.js
// Fetch helper for communicating with the ICT461 API.

const API_BASE_URL = "http://localhost:3000/api";

/**
 * Sends an HTTP request to the API.
 *
 * @param {string} endpoint - API endpoint.
 * @param {object} options - Fetch options.
 * @returns {Promise<object>}
 */
export async function apiRequest(endpoint, options = {}) {

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,

        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    // A 204 response has no body.
    if (response.status === 204) {
        return {
            status: response.status,
            data: null
        };
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || `Request failed with status ${response.status}`
        );
    }

    return {
        status: response.status,
        data
    };
}


/**
 * Submit a new course registration.
 *
 * @param {object} registration
 * @returns {Promise<object>}
 */
export async function createRegistration(registration) {

    return apiRequest("/registrations", {
        method: "POST",
        body: JSON.stringify(registration)
    });
}
