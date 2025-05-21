import NetInfo from "@react-native-community/netinfo";
import { create } from "zustand";

export interface Connection {
  type: string;
  ipAddress: string;
  isActive?: boolean;
}

interface ConnectionState {
  connections: Connection[];
  isLoading: boolean;
  error: string | null;
  fetchNetworkInfo: () => Promise<void>;
  addConnection: (connection: Connection) => void;
  removeConnection: (index: number) => void;
}

// Helper function to get a user-friendly network type name
const getNetworkTypeName = (netInfoType: string): string => {
  switch (netInfoType) {
    case "cellular":
      return "Cellular";
    case "wifi":
      return "WiFi";
    case "ethernet":
      return "Ethernet";
    case "bluetooth":
      return "Bluetooth";
    case "vpn":
      return "VPN";
    case "unknown":
    case "none":
    case "other":
    default:
      return "Unknown";
  }
};

// Helper to check if IP is valid
const isValidIp = (ip: string | null | undefined): boolean => {
  if (!ip) return false;
  return ip !== "0.0.0.0" && ip !== "Unknown" && ip !== "Not available";
};

// Fallback method to get IP addresses
const getNetworkIpAddresses = async (): Promise<Record<string, string>> => {
  return new Promise((resolve) => {
    // Default result
    const result: Record<string, string> = {
      ethernet: "0.0.0.0",
      wifi: "0.0.0.0",
    };

    try {
      // Try to use React Native's built-in networking APIs
      fetch("https://api.ipify.org?format=json")
        .then((response) => response.json())
        .then((data) => {
          // This will give us the external IP, which isn't ideal but works as fallback
          const netInfo = NetInfo.fetch();
          netInfo.then((state) => {
            if (state.type === "ethernet") {
              result.ethernet = data.ip;
            } else if (state.type === "wifi") {
              result.wifi = data.ip;
            }
            resolve(result);
          });
        })
        .catch(() => {
          // If fetch fails, just return default values
          resolve(result);
        });

      // Set a timeout in case network requests are slow
      setTimeout(() => resolve(result), 3000);
    } catch (e) {
      resolve(result);
    }
  });
};

// Create the store with initial values
const useConnectionStore = create<ConnectionState>()((set) => ({
  connections: [],
  isLoading: false,
  error: null,

  fetchNetworkInfo: async () => {
    // Don't set loading if already loading to prevent update loops
    set((state) => {
      if (state.isLoading) return state; // Return unchanged state if already loading
      return { ...state, isLoading: true, error: null };
    });

    try {
      // Get detailed network state using NetInfo
      const netInfoState = await NetInfo.fetch();

      // Create connections array
      const connections: Connection[] = [];

      // Get connection type and details
      const connectionType = getNetworkTypeName(netInfoState.type);

      // Handle active connection
      if (netInfoState.isConnected) {
        let ipAddress = "Detecting...";

        // Get IP address based on connection type
        if (netInfoState.type === "ethernet") {
          // For Ethernet, try to get the IP from details
          if (
            netInfoState.details &&
            netInfoState.details.ipAddress &&
            isValidIp(netInfoState.details.ipAddress)
          ) {
            ipAddress = netInfoState.details.ipAddress;
          } else {
            // If direct NetInfo approach doesn't work, use our advanced detection
            const usbEthernetDetection = async () => {
              // Make multiple attempts with increasing delays
              let attempts = 0;
              const maxAttempts = 3;

              const tryGetEthernetIp = async () => {
                attempts++;
                // Try NetInfo again
                const updatedState = await NetInfo.fetch();

                if (
                  updatedState.type === "ethernet" &&
                  updatedState.details &&
                  updatedState.details.ipAddress &&
                  isValidIp(updatedState.details.ipAddress)
                ) {
                  // Update the store with the new IP
                  set((state) => ({
                    connections: state.connections.map((conn) =>
                      conn.type === "Ethernet"
                        ? {
                            ...conn,
                            ipAddress: updatedState.details.ipAddress ?? "",
                          }
                        : conn
                    ),
                  }));
                } else if (attempts < maxAttempts) {
                  // If still no luck, try fallback method
                  const fallbackIps = await getNetworkIpAddresses();
                  if (isValidIp(fallbackIps.ethernet)) {
                    set((state) => ({
                      connections: state.connections.map((conn) =>
                        conn.type === "Ethernet"
                          ? { ...conn, ipAddress: fallbackIps.ethernet }
                          : conn
                      ),
                    }));
                  } else {
                    // Schedule another attempt with exponential backoff
                    setTimeout(tryGetEthernetIp, 1000 * Math.pow(2, attempts));
                  }
                }
              };

              // Start the detection process
              tryGetEthernetIp();
            };

            // Start the USB Ethernet detection process
            usbEthernetDetection();
          }
        } else if (netInfoState.type === "wifi") {
          // For WiFi, the IP should be available in details
          if (
            netInfoState.details &&
            netInfoState.details.ipAddress &&
            isValidIp(netInfoState.details.ipAddress)
          ) {
            ipAddress = netInfoState.details.ipAddress;
          }
        }

        connections.push({
          type: connectionType,
          ipAddress: ipAddress,
          isActive: true,
        });
      } else {
        // No active connection
        connections.push({
          type: connectionType,
          ipAddress: "Not connected",
          isActive: false,
        });
      }

      // Keep any manually added connections
      set((state) => {
        const manualConnections = state.connections.filter(
          (conn) =>
            conn.type !== "WiFi" &&
            conn.type !== "Ethernet" &&
            conn.type !== connectionType &&
            !conn.isActive // Only keep manual connections that aren't active
        );

        return {
          connections: [...connections, ...manualConnections],
          isLoading: false,
          error: null,
        };
      });
    } catch (error) {
      console.error("Failed to fetch network info: ", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      set({ isLoading: false, error: `Network info error: ${errorMessage}` });
    }
  },

  addConnection: (connection: Connection) => {
    if (!connection || !connection.type || !connection.ipAddress) {
      throw new Error("Invalid connection data provided.");
    }

    set((state) => ({
      connections: [...state.connections, { ...connection, isActive: false }],
      error: null,
    }));
  },

  removeConnection: (index: number) => {
    set((state) => {
      if (index < 0 || index >= state.connections.length) {
        throw new Error("Invalid index provided.");
      }

      return {
        connections: state.connections.filter((_, i) => i !== index),
        error: null,
      };
    });
  },
}));

export default useConnectionStore;
