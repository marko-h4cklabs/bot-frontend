interface ToggleProps {
    isChecked: boolean;
    onToggle: () => void;
  }
  
  export default function Toggle({ isChecked, onToggle }: ToggleProps) {
    return (
      <label className="relative inline-block w-10 h-6">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onToggle}
          className="hidden"
        />
        <span className={`absolute inset-0 bg-gray-300 dark:bg-gray-700 rounded-full transition
          ${isChecked ? "bg-blue-500 dark:bg-blue-400" : ""}`}></span>
        <span
          className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform
          ${isChecked ? "translate-x-4" : ""}`}
        />
      </label>
    );
  }
  