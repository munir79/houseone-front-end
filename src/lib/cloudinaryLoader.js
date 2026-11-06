// next/image এই Function দিয়ে Screen অনুযায়ী ছোট ছবি চায়
// Cloudinary নিজেই WebP/AVIF ও সঠিক মাপ দেয়, তাই মোবাইলে ছবি হালকা থাকে
export const cloudinaryLoader = ({ src, width, quality }) =>
  src.replace("/upload/", `/upload/f_auto,q_${quality || "auto"},c_limit,w_${width}/`);
