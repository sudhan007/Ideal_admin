interface IConfig {
  baseUrl: string;
}


const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

export const Config: IConfig = {
  baseUrl: BACKEND_BASE_URL,
};
