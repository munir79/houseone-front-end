"use client";

import ExpenseBoard from "@/components/expense/ExpenseBoard";
import PageHeader from "@/components/ui/PageHeader";
import { useWorkspace } from "@/hooks/useWorkspace";

const ExpensesPage = () => {
  const { houses } = useWorkspace();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Expenses" description="মেরামত, বেতন, বিল — সব খরচ আর মাসের লাভ এক জায়গায়" />
      <ExpenseBoard properties={houses} />
    </div>
  );
};

export default ExpensesPage;
