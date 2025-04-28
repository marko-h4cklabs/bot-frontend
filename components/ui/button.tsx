// components/ui/button.tsx
import clsx from 'clsx'; // Use clsx or tailwind-merge for better class combination

// Add standard HTMLButton attributes like onClick, disabled, etc.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    size?: "sm" | "md" | "lg" | "xl" | "mobile-sm" | "mobile-md" | "mobile-lg";
    color?: "default" | "secondary" | "danger" | "accept" | "question";
    children: React.ReactNode;
}

const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-3 py-1.5 text-base",
    lg: "px-4 py-2 text-lg",
    xl: "px-5 py-3 text-xl",
    "mobile-sm": "px-2 py-1 text-xs",
    "mobile-md": "px-3 py-1 text-sm",
    "mobile-lg": "px-4 py-2 text-base",
};

const colorClasses = {
    default: "bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50",
    secondary: "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50",
    danger: "bg-red-500 text-white hover:bg-red-600 disabled:opacity-50",
    accept: "bg-green-500 text-white hover:bg-green-600 disabled:opacity-50",
    question: "bg-yellow-500 text-black hover:bg-yellow-600 disabled:opacity-50",
};

export default function Button({ size = "md", color = "default", children, className, ...props }: ButtonProps) {
    return (
        <button
            className={clsx(
                'rounded transition', // Use clsx
                sizeClasses[size],
                colorClasses[color],
                className // Allow overriding/adding classes
            )}
            {...props} // Spread remaining props (like onClick, disabled)
        >
            {children}
        </button>
    );
}