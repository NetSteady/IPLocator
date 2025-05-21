import React, { useCallback } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import "../global.css";
import useConnectionStore from "../utils/ConnectionStore";

const UpdateButton = () => {
  // Use separate selectors for better performance
  const isLoading = useConnectionStore((state) => state.isLoading);
  const fetchNetworkInfo = useConnectionStore(
    (state) => state.fetchNetworkInfo
  );

  // Memoize the button handler to prevent recreation on every render
  const buttonHandler = useCallback(() => {
    fetchNetworkInfo();
  }, [fetchNetworkInfo]);

  return (
    <View className="h-1/6 w-5/6 pb-10">
      <TouchableOpacity
        className="bg-blue-500 rounded-2xl flex items-center justify-center h-full"
        onPress={buttonHandler}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#ffffff" />
        ) : (
          <Text className="text-zinc-50 text-5xl">Refresh Network</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default UpdateButton;
