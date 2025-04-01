// Restricted admin emails that can only edit status and remarks
const RESTRICTED_ADMIN_EMAILS = ["nbsesra1@jh.edu", "ppatil14@jh.edu"];

/**
 * Checks if the current admin user has restricted permissions
 * (can only edit status and remarks)
 *
 * @returns {boolean} true if admin is restricted, false otherwise
 */
export const isRestrictedAdmin = (): boolean => {
  const userEmail = localStorage.getItem("userEmail");
  return RESTRICTED_ADMIN_EMAILS.includes(userEmail || "");
};
