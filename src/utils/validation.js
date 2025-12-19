/**
 * Validation utility functions for form inputs
 */

/**
 * Validates an email address
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a phone number (basic validation)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validatePhone = (phone) => {
  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  // Check if it's 10-15 digits, possibly starting with +
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(cleanPhone);
};

/**
 * Validates a ZIP/postal code (supports formats from multiple countries)
 * @param {string} zip - ZIP/postal code to validate
 * @param {string} country - Country code (e.g., 'US', 'CA')
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateZip = (zip, country) => {
  // Remove spaces
  const cleanZip = zip.replace(/\s/g, '');
  
  // Country-specific validation
  switch (country) {
    case 'US':
      // US ZIP: 5 digits or 5+4
      return /^\d{5}(-\d{4})?$/.test(cleanZip);
    case 'CA':
      // Canadian postal code: A1A 1A1
      return /^[A-Za-z]\d[A-Za-z]\d[A-Za-z]\d$/.test(cleanZip);
    case 'GB':
      // UK postcode
      return /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/.test(zip);
    case 'AU':
      // Australian postcode: 4 digits
      return /^\d{4}$/.test(cleanZip);
    default:
      // Generic validation: 3-10 alphanumeric characters
      return /^[0-9a-zA-Z-]{3,10}$/.test(cleanZip);
  }
};

/**
 * Validates a complete address
 * @param {Object} address - Address object to validate
 * @param {string} address.firstName - First name
 * @param {string} address.lastName - Last name
 * @param {string} address.address1 - Address line 1
 * @param {string} address.city - City
 * @param {string} address.state - State/Province
 * @param {string} address.zip - ZIP/Postal code
 * @param {string} address.country - Country code
 * @param {string} address.phone - Phone number
 * @returns {Object} - { isValid: boolean, errors: { field: string }[] }
 */
export const validateAddress = (address) => {
  const errors = {};
  
  // Required fields
  const requiredFields = [
    'firstName', 'lastName', 'address1', 'city', 'state', 'zip', 'country', 'phone'
  ];
  
  // Check required fields
  requiredFields.forEach(field => {
    if (!address[field]) {
      errors[field] = 'This field is required';
    }
  });
  
  // Validate email if provided
  if (address.email && !validateEmail(address.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Validate phone
  if (address.phone && !validatePhone(address.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }
  
  // Validate ZIP/postal code
  if (address.zip && address.country && !validateZip(address.zip, address.country)) {
    errors.zip = 'Please enter a valid ZIP/postal code';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Formats a phone number for display
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
export const formatPhone = (phone) => {
  // Remove non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Format based on length and whether it starts with +
  if (cleaned.startsWith('+')) {
    if (cleaned.length <= 4) {
      return cleaned;
    }
    // International format
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`.trim();
  } else {
    // US format
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return cleaned;
  }
};

/**
 * Formats a ZIP/postal code for display based on country
 * @param {string} zip - ZIP/postal code to format
 * @param {string} country - Country code
 * @returns {string} - Formatted ZIP/postal code
 */
export const formatZip = (zip, country) => {
  const cleaned = zip.replace(/\s/g, '');
  
  switch (country) {
    case 'CA':
      // Canadian format: A1A 1A1
      if (cleaned.length === 6) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
      }
      return zip;
    case 'GB':
      // UK format varies, but generally split into two parts
      if (cleaned.length > 4) {
        const inward = cleaned.slice(-3);
        const outward = cleaned.slice(0, -3);
        return `${outward} ${inward}`;
      }
      return zip;
    default:
      return zip;
  }
};
