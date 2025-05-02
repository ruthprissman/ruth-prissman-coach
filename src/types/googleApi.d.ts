
// Type declarations for the Google API Client Library
interface Window {
  gapi: any;
  google: {
    accounts: {
      oauth2: {
        initTokenClient: (options: any) => any;
        revoke: (token: string, callback?: () => void) => void;
      }
    }
  };
}
