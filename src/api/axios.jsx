import axios from "axios";

const BASE_URL = "https://api.sheetresolve.com/api";
// const BASE_URL = "http://localhost:3501/api";

export default axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Include cookies in requests
});

export const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // Include cookies in requests
});