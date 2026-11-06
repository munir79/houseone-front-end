export const baseUriBackend = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';

// API Basery
export const API_BASE_URL = baseUriBackend + 'api/v1/';

// Authentication
export const SIGN_UP = API_BASE_URL + 'user/sign-up';
export const VERIFY_EMAIL = API_BASE_URL + 'user/verify-email';
export const RESEND_OTP = API_BASE_URL + 'user/resend-otp';
export const SIGN_IN = API_BASE_URL + 'user/sign-in';
export const FORGOT_PASSWORD = API_BASE_URL + 'user/forgot-password';
export const VERIFY_OTP = API_BASE_URL + 'user/verify-otp';
export const RESET_PASSWORD = API_BASE_URL + 'user/reset-password';
export const GET_MY_PROFILE = API_BASE_URL + 'user/get-my-profile';

// Notification
export const MY_NOTIFICATIONS = API_BASE_URL + 'notification/my-notifications';
export const READ_ALL_NOTIFICATIONS = API_BASE_URL + 'notification/read-all';
export const NOTIFICATION_BY_ID = (id) => API_BASE_URL + `notification/${id}`;

// Location
export const LOCATION_AREAS = API_BASE_URL + 'location/areas';
export const LOCATION_SEARCH = API_BASE_URL + 'location/search';

// Upload
export const UPLOAD_SIGNATURE = API_BASE_URL + 'upload/signature';

// Property
export const PROPERTIES = API_BASE_URL + 'property';
export const PROPERTY_SUMMARY = API_BASE_URL + 'property/summary';
export const PROPERTY_BY_ID = (id) => API_BASE_URL + `property/${id}`;
export const PROPERTY_CONTACTS = (id) => API_BASE_URL + `property/${id}/contacts`;
export const PROPERTY_CONTACT_BY_ID = (id, contactId) => API_BASE_URL + `property/${id}/contacts/${contactId}`;

// Unit
export const PROPERTY_UNITS = (id) => API_BASE_URL + `property/${id}/units`;
export const PROPERTY_UNITS_BULK = (id) => API_BASE_URL + `property/${id}/units/bulk`;
export const UNIT_BY_ID = (id) => API_BASE_URL + `unit/${id}`;

// Socket
export const socketUri = baseUriBackend;
