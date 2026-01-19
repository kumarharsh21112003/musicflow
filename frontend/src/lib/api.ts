// Backend API configuration
// Try multiple ports in order

const BACKEND_PORTS = [3003, 3004, 3002, 3005];
let currentPortIndex = 0;

export const getBackendUrl = () => {
  return `http://localhost:${BACKEND_PORTS[currentPortIndex]}`;
};

export const tryNextPort = () => {
  currentPortIndex = (currentPortIndex + 1) % BACKEND_PORTS.length;
  console.log(`Trying backend port: ${BACKEND_PORTS[currentPortIndex]}`);
};

export const BACKEND_URL = getBackendUrl();
