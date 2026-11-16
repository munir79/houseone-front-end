"use client";

import { useState } from "react";
import { Handshake, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { PAYMENT_METHODS, methodLabel } from "@/lib/paymentOptions";
import { formatDate, todayInput } from "@/lib/tenancyOptions";
import { toEnglishNumber } from "@/lib/toBanglaNumber";
import { useGetMyProfileQuery } from "@/redux/features/auth/authApi";
import { useDeleteSettlementMutation, useRecordSettlementMutation } from "@/redux/features/share/shareApi";

// দেনা মেটানো লিখে রাখা — কে দিলেন, কে পেলেন, কত
const SettleModal = ({ propertyId, people, start, onClose }) => {
  const [values, setValues] = useState({ from: start.from, to: start.to, amount: String(start.amount), paidAt: todayInput(), method: "Cash", note: "" });
  const [recordSettlement, { isLoading }] = useRecordSettlementMutation();
  const options = people.map(({ _id, name }) => ({ value: _id, label: name }));
  const change = (field) => (event) => setValues((prev) => ({ ...prev, [field]: field === "amount" ? toEnglishNumber(event.target.value).replace(/\D/g, "") : event.target.value }));

  const handleSave = async () => {
    if (values.from === values.to) return toast.error("যিনি দিলেন আর যিনি পেলেন আলাদা হতে হবে");
    if (!(Number(values.amount) >= 1)) return toast.error("টাকা লিখুন");
    try {
      await recordSettlement({ propertyId, ...values, amount: Number(values.amount) }).unwrap();
      toast.success("দেনা মেটানো লেখা হয়েছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title="Record Settlement" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select id="settleFrom" label="যিনি দিলেন" options={options} value={values.from} onChange={change("from")} />
          <Select id="settleTo" label="যিনি পেলেন" options={options} value={values.to} onChange={change("to")} />
          <Input id="settleAmount" inputMode="numeric" label="টাকা (৳)" value={values.amount} onChange={change("amount")} />
          <Input id="settleDate" type="date" label="তারিখ" value={values.paidAt} onChange={change("paidAt")} />
          <Select id="settleMethod" label="কীভাবে" options={PAYMENT_METHODS} value={values.method} onChange={change("method")} />
          <Input id="settleNote" label="নোট (ঐচ্ছিক)" value={values.note} onChange={change("note")} />
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={isLoading} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// রিপোর্টের নিচে — বাকি দেনা মেটানো ও আগের মেটানোর তালিকা (PDF এ আসে না)
const SettlePanel = ({ propertyId, shares }) => {
  const [settling, setSettling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { data: profile } = useGetMyProfileQuery();
  const [deleteSettlement, { isLoading: isDeleting }] = useDeleteSettlementMutation();

  const me = profile?.data?._id;
  const people = shares.rows.filter(({ isOwner }) => isOwner);
  const nameOf = (id) => shares.rows.find(({ _id }) => _id === id)?.name || "—";
  const mainId = shares.rows.find(({ isMain }) => isMain)?._id;

  const handleDelete = async () => {
    try {
      await deleteSettlement({ propertyId, settlementId: deleting._id }).unwrap();
      toast.success("মুছে গেছে");
      setDeleting(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "মোছা যায়নি"));
    }
  };

  return (
    <Card data-settle-panel className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Handshake className="h-5 w-5 text-primary" aria-hidden="true" />
          দেনা-পাওনা মেটানো
        </h2>
        {people.length > 1 && (
          <Button variant="outline" size="sm" onClick={() => setSettling({ from: people[0]._id, to: people[1]._id, amount: "" })}>
            নিজে লিখুন
          </Button>
        )}
      </div>

      {shares.transfers.map((transfer, index) => (
        <div key={index} data-transfer className="flex flex-col gap-2 rounded-xl border border-warning/40 bg-warning-soft px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-warning-foreground">
            {nameOf(transfer.from)} → {nameOf(transfer.to)}-কে দেবেন {formatMoney(transfer.amount)}
          </p>
          <Button size="sm" onClick={() => setSettling(transfer)}>
            মিটিয়েছি
          </Button>
        </div>
      ))}

      {shares.settlements.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {shares.settlements.map((item) => (
            <li key={item._id} data-settlement-row className="flex items-center gap-2 py-2 pr-1 pl-3">
              <span className="min-w-0 flex-1 text-sm">
                <span className="font-semibold">
                  {nameOf(item.from)} → {nameOf(item.to)} · {formatMoney(item.amount)}
                </span>
                <span className="block text-xs text-muted">
                  {formatDate(item.paidAt)} · {methodLabel(item.method)}
                  {item.note && ` · ${item.note}`}
                </span>
              </span>
              {(item.createdBy === me || mainId === me) && (
                <button type="button" onClick={() => setDeleting(item)} aria-label="Delete settlement" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {settling && <SettleModal propertyId={propertyId} people={people} start={settling} onClose={() => setSettling(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete settlement?"
          message={`${nameOf(deleting.from)} → ${nameOf(deleting.to)} · ${formatMoney(deleting.amount)} মুছে যাবে, দেনা আবার দেখাবে।`}
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </Card>
  );
};

export default SettlePanel;
