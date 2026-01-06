/**
 * WalipherOS Shared Utilities
 * Centralized helper functions for formatting and common logic.
 */

// Format Currencies (RD$)
// Usage: formatCurrency(1500) -> "1,500"
export const formatCurrency = (num) => {
    return num.toLocaleString('es-DO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
};

// Format Time (HH:mm AM/PM)
// Usage: formatTime("14:30") -> "2:30 PM"
export const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(':');
    let hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12; // 0 becomes 12
    return `${hour}:${m} ${ampm}`;
};

// Generate Simple ID
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
