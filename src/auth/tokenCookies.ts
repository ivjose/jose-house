export const setTokenCookie = (token: String) => {
  fetch("/api/login", {
    method: "post",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ token }),
  });
};

export const removeTokenCookie = () => {
  fetch("/api/logout", {
    method: "post",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  });
};
