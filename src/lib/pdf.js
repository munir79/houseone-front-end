const MARGIN_MM = 8;
const PDF_WIDTH_PX = 760;
const SHRINK_TO_ONE_PAGE = 1.3;

// ফোনেও A4 এর মাপে তৈরি হয় — পর্দার বাইরে একটি কপি বানিয়ে ছবি নেওয়া হয়
const captureAtPdfWidth = async (node, toJpeg) => {
  const holder = document.createElement("div");
  holder.style.cssText = `position:fixed;left:-10000px;top:0;width:${PDF_WIDTH_PX}px`;

  const clone = node.cloneNode(true);
  holder.appendChild(clone);
  document.body.appendChild(holder);

  try {
    const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue("--color-surface").trim();
    const image = await toJpeg(clone, { quality: 0.92, pixelRatio: 2, backgroundColor });
    return { image, ratio: clone.offsetHeight / clone.offsetWidth };
  } finally {
    holder.remove();
  }
};

// পাতাটাই ছবি হয়ে PDF হয়, তাই বাংলা যুক্তাক্ষর ঠিক থাকে। প্যাকেজ শুধু দরকার হলে লোড হয়
const buildPdf = async (node) => {
  const [{ toJpeg }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
  const { image, ratio } = await captureAtPdfWidth(node, toJpeg);

  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth() - MARGIN_MM * 2;
  const pageHeight = pdf.internal.pageSize.getHeight() - MARGIN_MM * 2;
  const imageHeight = ratio * pageWidth;

  // সামান্য বড় হলে এক পাতায় ছোট করে বসে, অনেক বড় হলে তবেই কয়েক পাতা
  if (imageHeight <= pageHeight * SHRINK_TO_ONE_PAGE) {
    const scale = Math.min(1, pageHeight / imageHeight);
    const width = pageWidth * scale;
    pdf.addImage(image, "JPEG", MARGIN_MM + (pageWidth - width) / 2, MARGIN_MM, width, imageHeight * scale);
  } else {
    for (let top = 0, page = 0; top < imageHeight; top += pageHeight, page += 1) {
      if (page > 0) pdf.addPage();
      pdf.addImage(image, "JPEG", MARGIN_MM, MARGIN_MM - top, pageWidth, imageHeight);
    }
  }

  return pdf;
};

export const downloadPdf = async (node, fileName) => (await buildPdf(node)).save(fileName);

export const makePdfFile = async (node, fileName) => new File([(await buildPdf(node)).output("blob")], fileName, { type: "application/pdf" });

// মোবাইলে PDF সহ শেয়ার, কম্পিউটারে বা শেয়ার না চললে PDF নামিয়ে WhatsApp এ বার্তা
export const sendPdfOnWhatsApp = async ({ node, fileName, text, phone }) => {
  const file = await makePdfFile(node, fileName);

  // ফোনে Share মেনু দিয়ে PDF সহ WhatsApp এ — কম্পিউটারের Share মেনুতে WhatsApp থাকে না
  const isPhone = window.matchMedia("(pointer: coarse)").matches;
  if (isPhone && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return;
    } catch (err) {
      if (err?.name === "AbortError") throw err;
    }
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
  window.open(`https://wa.me/88${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
};
