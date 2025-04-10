import { useState, useCallback, useEffect } from 'react';

export const ITEMS_PER_PAGE = 10;

export const useBusinessLeads = (initialData = []) => {
  const [data, setData] = useState(initialData);
  const [filteredData, setFilteredData] = useState(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    business_type: '',
    status: '',
    location: '',
    from_date: '',
    to_date: ''
  });

  // Apply filters to data
  const applyFilters = useCallback((data, filters) => {
    return data.filter(item => {
      const matchesSearch = !filters.search || 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(filters.search.toLowerCase())
        );
      
      const matchesBusinessType = !filters.business_type || 
        item.business_type === filters.business_type;
      
      const matchesStatus = !filters.status || 
        item.status === filters.status;
      
      const matchesLocation = !filters.location || 
        item.location.toLowerCase().includes(filters.location.toLowerCase());
      
      const matchesDate = (!filters.from_date && !filters.to_date) || 
        (new Date(item.created_at) >= new Date(filters.from_date) && 
         new Date(item.created_at) <= new Date(filters.to_date));

      return matchesSearch && matchesBusinessType && 
             matchesStatus && matchesLocation && matchesDate;
    });
  }, []);

  // Update filtered data when filters or data change
  useEffect(() => {
    const filtered = applyFilters(data, filters);
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [data, filters, applyFilters]);

  // Get paginated data
  const getPaginatedData = useCallback(() => {
    const isFiltering = Object.values(filters).some(val => val !== '');
    if (isFiltering) {
      return filteredData; // Return all filtered data when filtering
    }
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredData.slice(start, end);
  }, [currentPage, filteredData, filters]);

  return {
    data: getPaginatedData(),
    totalItems: filteredData.length,
    currentPage,
    setCurrentPage,
    filters,
    setFilters,
    setData,
    totalPages: Math.ceil(filteredData.length / ITEMS_PER_PAGE),
    isFiltering: Object.values(filters).some(val => val !== '')
  };
};