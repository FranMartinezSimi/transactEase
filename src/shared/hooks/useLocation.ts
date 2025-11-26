"use client";

import { useState, useEffect } from "react";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface UseLocationReturn {
  location: LocationData | null;
  isLoading: boolean;
  hasPermission: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if location is stored in sessionStorage
    const storedLocation = sessionStorage.getItem("userLocation");
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation);
        setLocation(parsed);
        setHasPermission(true);
        setIsLoading(false);
      } catch (e) {
        console.error("Failed to parse stored location", e);
      }
    }
  }, []);

  const requestPermission = async (): Promise<void> => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      setIsLoading(false);
      setHasPermission(false);
      throw new Error("Geolocation not supported");
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          setLocation(locationData);
          setHasPermission(true);
          setIsLoading(false);

          // Store in sessionStorage
          sessionStorage.setItem("userLocation", JSON.stringify(locationData));

          resolve();
        },
        (error) => {
          let errorMessage = "Failed to get location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }

          setError(errorMessage);
          setIsLoading(false);
          setHasPermission(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    });
  };

  return {
    location,
    isLoading,
    hasPermission,
    error,
    requestPermission,
  };
}
