const PageHeader = ({ title, description, action }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight wrap-break-word sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm wrap-break-word text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
};

export default PageHeader;
