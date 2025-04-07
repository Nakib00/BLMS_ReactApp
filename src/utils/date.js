import { format, parseISO } from 'date-fns';

export const formatDate = (dateString, formatString = 'MMM dd, yyyy HH:mm') => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
};

export const formatDateRange = (startDate, endDate) => {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'MMM dd, yyyy');
    }
    
    return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
  } catch (error) {
    console.error('Date range formatting error:', error);
    return `${startDate} - ${endDate}`;
  }
};

export const isValidDate = (date) => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return parsedDate instanceof Date && !isNaN(parsedDate);
  } catch (error) {
    return false;
  }
}; 