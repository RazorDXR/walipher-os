
const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}`;
};

const getDueDateColor = (dateStr) => {
    if (!dateStr) return '#94a3b8';
    const today = new Date().toISOString().split('T')[0];
    if (dateStr < today) return '#ef4444'; // Overdue
    if (dateStr === today) return '#facc15'; // Today
    return '#94a3b8'; // Future
};
