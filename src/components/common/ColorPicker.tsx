import { PERSON_COLORS } from '../../types';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label = 'Color' }: ColorPickerProps) {
  const isCustom = !(PERSON_COLORS as readonly string[]).includes(value);

  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {PERSON_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Usar color ${color}`}
            aria-pressed={value === color}
            onClick={() => onChange(color)}
            className={`h-touch w-touch rounded-full border-2 transition-transform ${
              value === color ? 'scale-110 border-slate-900 dark:border-white' : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
        <label
          className="relative flex h-touch w-touch cursor-pointer items-center justify-center rounded-full border-2 text-xs font-medium text-white"
          style={{ backgroundColor: isCustom ? value : '#94a3b8', borderColor: isCustom ? '#0f172a' : 'transparent' }}
        >
          <span className="sr-only">Elegir color personalizado</span>
          <span aria-hidden="true">+</span>
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </fieldset>
  );
}
