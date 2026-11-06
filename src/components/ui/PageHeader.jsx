const PageHeader = ({ title, description, action }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight wrap-break-word sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm wrap-break-word text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
};

export default PageHeader;
