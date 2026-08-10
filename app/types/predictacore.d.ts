export {};

declare global {
  interface Window {
    switchTab?: (tabName: string) => void;
    predictaCoreLogout?: () => void;
  }
}
