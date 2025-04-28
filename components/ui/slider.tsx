interface SliderProps {
    value: number;
    onChange: (value: number) => void;
  }
  
  export default function Slider({ value, onChange }: SliderProps) {
    return (
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
      />
    );
  }
  