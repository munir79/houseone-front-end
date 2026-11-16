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
export const LOCATION_REVERSE = API_BASE_URL + 'location/reverse';

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
export const UNIT_WITH_BUILDING = API_BASE_URL + 'unit/with-building';

// Tenant
export const TENANTS = API_BASE_URL + 'tenant';
export const TENANT_BY_ID = (id) => API_BASE_URL + `tenant/${id}`;
export const TENANT_NID = (id) => API_BASE_URL + `tenant/${id}/nid`;
export const TENANT_DOCUMENTS = (id) => API_BASE_URL + `tenant/${id}/documents`;

// Tenancy
export const TENANCIES = API_BASE_URL + 'tenancy';
export const TENANCY_SUMMARY = API_BASE_URL + 'tenancy/summary';
export const TENANCY_BY_ID = (id) => API_BASE_URL + `tenancy/${id}`;
export const TENANCY_NOTICE = (id) => API_BASE_URL + `tenancy/${id}/notice`;
export const TENANCY_END = (id) => API_BASE_URL + `tenancy/${id}/end`;
export const TENANCY_MEMBERS = (id) => API_BASE_URL + `tenancy/${id}/members`;
export const TENANCY_MEMBER = (id, memberId) => API_BASE_URL + `tenancy/${id}/members/${memberId}`;
export const MEMBER_REQUESTS = (id) => API_BASE_URL + `tenancy/${id}/member-requests`;
export const MEMBER_REQUEST_ACTION = (id, requestId, action) => API_BASE_URL + `tenancy/${id}/member-requests/${requestId}/${action}`;
export const UNIT_TENANCIES = (id) => API_BASE_URL + `unit/${id}/tenancies`;

// Bill
export const BILLS = API_BASE_URL + 'bill';
export const BILL_PREVIEW = API_BASE_URL + 'bill/preview';
export const BILL_GENERATE = API_BASE_URL + 'bill/generate';
export const BILL_BY_ID = (id) => API_BASE_URL + `bill/${id}`;
export const BILL_ADJUST = (id) => API_BASE_URL + `bill/${id}/adjust`;
export const TENANCY_BILLS = (id) => API_BASE_URL + `bill/tenancy/${id}`;
export const BILL_SENT = (id) => API_BASE_URL + `bill/${id}/sent`;
export const PUBLIC_BILL = (token) => API_BASE_URL + `public/bill/${token}`;

// Payment
export const PAYMENTS = API_BASE_URL + 'payment';
export const PAYMENT_RECEIPTS = API_BASE_URL + 'payment/receipts';

// Dashboard
export const DASHBOARD_MONEY = API_BASE_URL + 'dashboard/money';

// Expense
export const EXPENSES = API_BASE_URL + 'expense';
export const EXPENSE_BY_ID = (id) => API_BASE_URL + `expense/${id}`;
export const EXPENSE_RECURRING = API_BASE_URL + 'expense/recurring';
export const EXPENSE_RECURRING_BY_ID = (id) => API_BASE_URL + `expense/recurring/${id}`;

// Report
export const REPORT = API_BASE_URL + 'report';

// Account (Settings)
export const ACCOUNT = API_BASE_URL + 'account';

// Shared Access
export const PROPERTY_SHARING = (id) => API_BASE_URL + `property/${id}/sharing`;
export const INVITES = API_BASE_URL + 'invites';
export const PAYMENT_ADVANCE = API_BASE_URL + 'payment/advance';
export const PAYMENT_ADVANCE_SUMMARY = (tenancyId) => API_BASE_URL + `payment/advance/${tenancyId}`;
export const PAYMENT_ACTION = (id, action) => API_BASE_URL + `payment/${id}/${action}`;
export const PUBLIC_RECEIPT = (token) => API_BASE_URL + `public/receipt/${token}`;

// Complain & Needs
export const ISSUES = API_BASE_URL + 'issue';
export const ISSUE_BY_ID = (id) => API_BASE_URL + `issue/${id}`;
export const ISSUE_PHOTOS = (id) => API_BASE_URL + `issue/${id}/photos`;
export const PUBLIC_ISSUES = (token) => API_BASE_URL + `public/tenant-form/${token}/issues`;

// Tenant Form
export const TENANT_FORMS = API_BASE_URL + 'tenant-form';
export const TENANT_FORM_BY_ID = (id) => API_BASE_URL + `tenant-form/${id}`;
export const TENANT_FORM_BY_UNIT = (unitId) => API_BASE_URL + `tenant-form/unit/${unitId}`;
export const TENANT_FORM_ACTION = (id, action) => API_BASE_URL + `tenant-form/${id}/${action}`;
export const FORM_SETTINGS = (propertyId) => API_BASE_URL + `property/${propertyId}/form-settings`;
export const PUBLIC_FORM = (token) => API_BASE_URL + `public/tenant-form/${token}`;
export const PUBLIC_FORM_SIGNATURE = (token) => API_BASE_URL + `public/tenant-form/${token}/signature`;
export const PUBLIC_FORM_SUBMIT = (token) => API_BASE_URL + `public/tenant-form/${token}/submit`;
export const PUBLIC_MEMBER = (token) => API_BASE_URL + `public/member/${token}`;

// To-Let
export const LISTINGS = API_BASE_URL + 'listing';
export const LISTING_BY_ID = (id) => API_BASE_URL + `listing/${id}`;
export const LISTING_BY_UNIT = (unitId) => API_BASE_URL + `listing/unit/${unitId}`;
export const PUBLIC_LISTINGS = API_BASE_URL + 'public/to-let';
export const PUBLIC_LISTING = (code) => API_BASE_URL + `public/to-let/${code}`;

// Socket
export const socketUri = baseUriBackend;
