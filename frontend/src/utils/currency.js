/**
 * Utility functions for Indian Rupee (INR) currency formatting.
 * Uses Intl.NumberFormat with locale 'en-IN' and currency 'INR'.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a numeric value or numeric string to INR format (e.g. ₹1,250.00).
 *
 * @param {number|string|null|undefined} amount - The amount to format
 * @param {string} [fallback='—'] - The fallback value if amount is null, undefined, or empty
 * @returns {string} The formatted INR currency string
 */
export const formatINR = (amount, fallback = '—') => {
  if (amount === null || amount === undefined || amount === '') {
    return fallback;
  }
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(numeric)) {
    return fallback;
  }
  return inrFormatter.format(numeric);
};

export default formatINR;
