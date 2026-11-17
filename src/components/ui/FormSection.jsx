// লম্বা ফর্মকে ভাগে ভাগে দেখানোর জন্য
const FormSection = ({ title, children }) => {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</h3>
      {children}
    </section>
  );
};

export default FormSection;
