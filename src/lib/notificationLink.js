// নোটিফিকেশনে চাপলে কোথায় যাবে — নতুনগুলোর নিজের link থাকে, পুরনোগুলো কিসের নোটিফিকেশন তা দেখে
const BY_ENTITY = {
  TenantForm: (id) => `/tenants/forms/${id}`,
  Tenancy: (id) => `/tenants/${id}`,
  Issue: () => "/issues",
};

export const notificationLink = ({ link, entityType, entityId, type }) => {
  if (link) return link;
  if (entityType && entityId && BY_ENTITY[entityType]) return BY_ENTITY[entityType](entityId);
  return type === "Welcome" ? "/dashboard" : null;
};
