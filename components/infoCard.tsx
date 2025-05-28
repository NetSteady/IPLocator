import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import "../global.css";
import useConnectionStore from "../utils/ConnectionStore";

export default function InfoCards() {
  // Use separate selectors for better performance
  const connections = useConnectionStore((state) => state.connections);
  const isLoading = useConnectionStore((state) => state.isLoading);
  const fetchNetworkInfo = useConnectionStore(
    (state) => state.fetchNetworkInfo
  );

  // Use a ref to store the fetchNetworkInfo function to avoid dependency issues
  const fetchNetworkInfoRef = useRef(fetchNetworkInfo);

  // Update the ref when fetchNetworkInfo changes
  useEffect(() => {
    fetchNetworkInfoRef.current = fetchNetworkInfo;
  }, [fetchNetworkInfo]);

  // Set up network info fetching with stable ref
  useEffect(() => {
    // Initial fetch on mount
    const fetchData = async () => {
      await fetchNetworkInfoRef.current();
    };

    fetchData();

    // Set up interval using the ref - check every 5 seconds for better responsiveness
    const intervalId = setInterval(() => {
      fetchData();
    }, 5000);

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array = run only on mount

  if (isLoading && connections.length === 0) {
    return (
      <View className="flex items-center justify-center h-5/6">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-zinc-500 mt-4 text-lg">
          Loading network information...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex items-center justify-start pt-20 h-3/7">
      {connections.map((connection, index) => (
        <View
          key={index}
          className={`${
            connection.isActive ? "bg-zinc-500" : "bg-zinc-600"
          } rounded-lg mb-5 p-4 flex flex-row justify-between w-5/6`}
        >
          <View className="flex flex-row items-center">
            {connection.isActive && (
              <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
            )}
            <Text
              className={`bold text-zinc-50 pr-4 text-3xl ${
                connection.isActive ? "font-bold" : "font-normal"
              }`}
            >
              {connection.type}
            </Text>
          </View>
          <Text className="text-zinc-50 text-3xl">
            {connection.ipAddress === "Detecting..." ? (
              <Text className="text-yellow-300">Detecting...</Text>
            ) : (
              connection.ipAddress
            )}
          </Text>
        </View>
      ))}
      {connections.length === 0 && !isLoading && (
        <Text className="text-zinc-500 text-lg">
          No network connections found
        </Text>
      )}
    </View>
  );
}
