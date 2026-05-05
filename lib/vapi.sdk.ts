import Vapi from "@vapi-ai/web";

const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

if (typeof window !== "undefined" && !token) {
  console.warn(
    "[Vapi] NEXT_PUBLIC_VAPI_WEB_TOKEN is missing. Voice agent will not work. " +
      "Set it in your .env.local and Vercel environment variables."
  );
}

// Empty string lets module load; vapi.start() will throw a clear error if unset
export const vapi = new Vapi(token ?? "");

export const isVapiConfigured = () => Boolean(token);
