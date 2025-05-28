import { View } from "react-native";
import { WebView } from "react-native-webview";
import "../global.css";

const SpeedTest = () => {
  return (
    <View className="flex-1 w-5/6 h-6/7 mb-10">
      <WebView
        source={{
          uri: "http://netsteadyspeedtest.com/",
        }}
      />
    </View>
  );
};

export default SpeedTest;
