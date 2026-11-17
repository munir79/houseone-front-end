"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

// বাসা ছাড়ার নোটিশ ও Move out — দুটোতেই একটি তারিখ লাগে
const DateActionModal = ({ title, description, label, initialDate, confirmLabel, isLoading, onConfirm, onClose }) => {
  const [date, setDate] = useState(initialDate);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date) {
      setError("তারিখ দিন");
      return;
    }
    onConfirm(date);
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-muted">{description}</p>
        <Input
          id="actionDate"
          type="date"
          label={label}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setError("");
          }}
          error={error}
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DateActionModal;
