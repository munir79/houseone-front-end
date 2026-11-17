"use client";

import IssuePanel from "@/components/issue/IssuePanel";
import PageHeader from "@/components/ui/PageHeader";

const IssuesPage = () => (
  <div className="flex flex-col gap-5">
    <PageHeader title="Complain & Needs" description="সব বাড়ির খোলা অভিযোগ ও প্রয়োজন" />
    <IssuePanel canAdd={false} />
  </div>
);

export default IssuesPage;
