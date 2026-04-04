interface ImportMetaEnv {
   readonly VITE_GOOGLE_CLIENT_ID: string;
   readonly VITE_API_GATEWAY_BASE_URL: string;
   // add more as needed...
 }
 
 interface ImportMeta {
   readonly env: ImportMetaEnv;
 }
 