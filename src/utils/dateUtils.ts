/**
 * Checks if the current date is a blocked date (2nd, 11th, or 21st of any month)
 * @returns boolean - true if current date is blocked, false otherwise
 */
export const isBlockedDate = (): boolean => {
  const today = new Date();
  const day = today.getDate();

  // Check if today is the 2nd, 11th, or 21st of the month
  return day === 2 || day === 3 || day === 4 || day === 5 || day === 11 || day === 12 || day === 13 || day === 14 || day === 15 || day === 21 || day === 22 || day === 23 || day === 24 || day === 25;
};

/**
 * Returns the formatted toast message for blocked dates
 * @param actionType - The type of action being blocked (e.g., "invoices", "reimbursement requests", "PO requests")
 * @returns string - Formatted message for the toast notification
 */
export const getBlockedDateMessage = (actionType: string): string => {
  return `Creation of new ${actionType} is blocked on the 2nd - 5th, 11th - 15th, and 21st - 25th of each month!`;
};
