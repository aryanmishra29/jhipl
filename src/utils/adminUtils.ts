// Restricted admin emails that can only edit status and remarks
export const RESTRICTED_ADMIN_EMAILS = ["nbsesra1@jh.edu", "ppatil14@jh.edu"];

export const ADMIN_USER_MAPPINGS = {
  "ppatil14@jh.edu": [
    "3ed0da7a-d45c-43f0-8409-4dfff83076a3",
    "6b7a1060-c337-4493-89d1-e4c600b7e68a",
  ],
  "nbsesra1@jh.edu": ["f29e4687-5b36-40b2-80fb-5077293e6469"],
};

/**
 * Checks if the current admin user has restricted permissions
 * (can only edit status and remarks)
 *
 * @returns {boolean} true if admin is restricted, false otherwise
 */
export const isRestrictedAdmin = (): boolean => {
  const adminEmail = localStorage.getItem("userEmail");
  return RESTRICTED_ADMIN_EMAILS.includes(adminEmail || "");
};

export const getRestrictedAdminEmail = (): string | null => {
  return localStorage.getItem("userEmail");
};

export const getRestrictedAdminUserIds = (adminEmail: string): string[] => {
  return (
    ADMIN_USER_MAPPINGS[adminEmail as keyof typeof ADMIN_USER_MAPPINGS] || []
  );
};
