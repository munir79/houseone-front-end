// ফাঁকা Value বাদ দিয়ে Tailwind Class গুলো জোড়া লাগায়
export const cn = (...classes) => classes.filter(Boolean).join(" ");
