import React from "react";
import { View } from "react-native";
import InfoCards from "../components/infoCard";
import SpeedTest from "../components/SpeedTest";
import UpdateButton from "../components/updateButton";
import "../global.css";

// Use React.memo to prevent unnecessary re-renders
const Index = React.memo(() => {
  return (
    <View className="bg-zinc-700 flex-1 items-center justify-start">
      <InfoCards />
      <SpeedTest />
      <UpdateButton />
    </View>
  );
});

export default Index;
