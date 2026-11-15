"use client";

import ExpenseBoard from "@/components/expense/ExpenseBoard";
import PageHeader from "@/components/ui/PageHeader";
import { useGetPropertiesQuery } from "@/redux/features/property/propertyApi";

const ExpensesPage = () => {
  const { data } = useGetPropertiesQuery({ page: 1, search: "" });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Expenses" description="মেরামত, বেতন, বিল — সব খরচ আর মাসের লাভ এক জায়গায়" />
      <ExpenseBoard properties={data?.data?.data || []} />
    </div>
  );
};

export default ExpensesPage;
