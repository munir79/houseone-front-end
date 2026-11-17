"use client";

import { useDispatch } from "react-redux";
import { apiSlice } from "@/redux/api/apiSlice";
import { useSocketEvent } from "./useSocketEvent";

// অন্য Device বা শেয়ার মালিক কিছু বদলালে খোলা Page নিজে থেকে নতুন ডেটা আনে
const RealtimeSync = () => {
  const dispatch = useDispatch();

  useSocketEvent("data:changed", ({ tags }) => {
    dispatch(apiSlice.util.invalidateTags(tags));
  });

  return null;
};

export default RealtimeSync;
