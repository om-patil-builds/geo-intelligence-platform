import React, { createContext, useContext, useState } from 'react';

const PlacesContext = createContext(null);

export function PlacesProvider({ children }) {
  const [results, setResults] = useState([]);
  const [jobId, setJobId] = useState(null);

  const clearPlaces = () => {
    setResults([]);
    setJobId(null);
  };

  return (
    <PlacesContext.Provider value={{ results, setResults, jobId, setJobId, clearPlaces }}>
      {children}
    </PlacesContext.Provider>
  );
}

export function usePlaces() {
  return useContext(PlacesContext);
}
