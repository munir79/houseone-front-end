import { toBanglaNumber } from "./toBanglaNumber";

const PHONE_REGEX = /^01[3-9]\d{8}$/;
const NID_REGEX = /^\d{10,17}$/;

export const PERSON_STEPS = [
  { key: "personal", title: "ব্যক্তিগত তথ্য", fields: ["gender"] },
  { key: "address", title: "কাজ ও ঠিকানা", fields: ["occupation", "workplace", "permanentAddress", "previousAddress"] },
  { key: "papers", title: "NID ও ছবি", fields: ["nid", "nidPhoto", "photo"] },
];

export const emptyPerson = () => ({
  key: `new-${Math.random().toString(36).slice(2)}`,
  name: "",
  phone: "",
  gender: "",
  age: "",
  relation: "",
  occupation: "",
  workplace: "",
  permanentAddress: "",
  previousAddress: "",
  nid: "",
  nidLast4: "",
  nidFront: null,
  nidBack: null,
  photo: null,
});

export const visibleSteps = (fields) => PERSON_STEPS.filter((step) => step.key === "personal" || step.fields.some((field) => fields[field] !== "Off"));

export const personLabel = (index, { mainCount, occupantType }) => {
  if (index < mainCount) return `প্রধান দায়িত্বশীল ${toBanglaNumber(index + 1)}`;
  return `${occupantType === "Shop" ? "অংশীদার" : "সদস্য"} ${toBanglaNumber(index + 1)}`;
};

// isFull — প্রধান, অথবা যে ধরনে সবার পুরো তথ্য লাগে
export const stepErrors = (stepKey, person, fields, isFull) => {
  const errors = {};
  const isRequired = (field) => isFull && fields[field] === "Required";
  const need = (key, field, message) => {
    if (isRequired(field) && !String(person[key] ?? "").trim()) errors[key] = message;
  };

  if (stepKey === "personal") {
    if (!person.name.trim()) errors.name = "নাম লিখুন";
    if (isFull && !person.phone.trim()) errors.phone = "মোবাইল নম্বর লিখুন";
    if (person.phone.trim() && !PHONE_REGEX.test(person.phone.trim())) errors.phone = "সঠিক মোবাইল নম্বর লিখুন, যেমন 01712345678";
    need("gender", "gender", "লিঙ্গ বেছে নিন");
  }

  if (stepKey === "address") {
    need("occupation", "occupation", "পেশা লিখুন");
    need("workplace", "workplace", "কর্মস্থলের নাম লিখুন");
    need("permanentAddress", "permanentAddress", "স্থায়ী ঠিকানা লিখুন");
    need("previousAddress", "previousAddress", "আগের ঠিকানা লিখুন");
  }

  if (stepKey === "papers") {
    const nid = person.nid.replace(/\s/g, "");
    if (isRequired("nid") && !nid && !person.nidLast4) errors.nid = "NID নম্বর লিখুন";
    if (nid && !NID_REGEX.test(nid)) errors.nid = "NID ১০ থেকে ১৭ সংখ্যার হতে হবে";
    if (isRequired("nidPhoto") && !person.nidFront) errors.nidFront = "সামনের ছবি দিন";
    if (isRequired("nidPhoto") && !person.nidBack) errors.nidBack = "পেছনের ছবি দিন";
    if (isRequired("photo") && !person.photo) errors.photo = "ছবি দিন";
  }

  return errors;
};

export const isPersonComplete = (person, fields, isFull) =>
  PERSON_STEPS.every((step) => Object.keys(stepErrors(step.key, person, fields, isFull)).length === 0);

// ঐচ্ছিক সদস্যের কার্ড খালি রেখে দিলে সেটা জমা হয় না
export const isBlankPerson = (person) =>
  !["name", "phone", "gender", "age", "relation", "occupation", "workplace", "permanentAddress", "previousAddress", "nid"].some((key) => String(person[key] ?? "").trim()) &&
  !person.nidFront &&
  !person.nidBack &&
  !person.photo;

export const extraErrors = (extra, fields) => {
  const errors = {};
  if (fields.companyName === "Required" && !extra.companyName.trim()) errors.companyName = "প্রতিষ্ঠান বা দোকানের নাম লিখুন";
  if (fields.tradeLicense === "Required" && !extra.tradeLicense.trim()) errors.tradeLicense = "Trade License নম্বর লিখুন";
  if (fields.emergency === "Required" && !extra.emergencyName.trim()) errors.emergencyName = "জরুরি যোগাযোগের নাম লিখুন";
  if (fields.emergency === "Required" && !extra.emergencyPhone.trim()) errors.emergencyPhone = "জরুরি যোগাযোগের মোবাইল লিখুন";
  if (extra.emergencyPhone.trim() && !PHONE_REGEX.test(extra.emergencyPhone.trim())) errors.emergencyPhone = "সঠিক মোবাইল নম্বর লিখুন";
  return errors;
};
