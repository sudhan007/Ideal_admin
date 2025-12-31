import { V3 as PS } from "paseto";

export const generatePasetoSecret = async () => {
  const key = await PS.generateKey("local", {
    format: "paserk"
  })
  return key
}

const PASETO_KEY: string | undefined = process.env.PASETO_SECRET_KEY

export const EncodePaseto = async (payload: Record<string, string>) => {
  try {
    if (PASETO_KEY) {
      return await PS.encrypt(payload, PASETO_KEY);
    } else {
      throw new Error("PASETO_KEY is not defined");
    }

  } catch (error: any) {
    console.error("Failed to encode Paseto token:", error);
    return null;
  }
};


export const DecodePaseto = async (token: string) => {
  try {
    if (PASETO_KEY) {
      return await PS.decrypt(token, PASETO_KEY);
    } else {
      throw new Error("PASETO_KEY is not defined");
    }
  } catch (error) {
    console.error("Failed to decode Paseto token:", error);
    return null
  }
}
