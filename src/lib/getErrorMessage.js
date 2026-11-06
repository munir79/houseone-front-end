// RTK Query র Error থেকে User কে দেখানোর মতো Message
export const getErrorMessage = (err, fallback = "Something went wrong. Please try again.") => {
  if (err?.status === "FETCH_ERROR") return "Could not reach the server. Check your internet and try again.";
  return err?.data?.message || fallback;
};
