import Link from "next/link";
import { buttonClasses } from "./Button";

// দেখতে Button, কিন্তু আসলে Link
const LinkButton = ({ href, variant, size, fullWidth, className, children, ...props }) => {
  return (
    <Link href={href} className={buttonClasses({ variant, size, fullWidth, className })} {...props}>
      {children}
    </Link>
  );
};

export default LinkButton;
