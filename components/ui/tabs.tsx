type TabsProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export function Tabs({ options, value, onChange }: TabsProps) {
  return (
    <div className="inline-flex w-full rounded-full bg-slate-100 p-1">
      {options.map((option) => {
        const active = option === value;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-white text-[#2D3142] shadow-sm"
                : "text-slate-500 hover:text-[#2D3142]"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}