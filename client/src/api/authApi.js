import API from "./axios";

export const loginUser = async (data) => {
  const response = await API.post("/auth/login", data);

  return response.data;
};

export const registerUser = async (data) => {
  const response = await API.post("/auth/register", data);

  return response.data;
};

export const fetchMe = async () => {
  const response = await API.get("/auth/me");

  return response.data;
};