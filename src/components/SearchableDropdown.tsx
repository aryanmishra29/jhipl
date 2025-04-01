import { useState, useEffect, FocusEvent, ChangeEvent, FC } from "react";
import { ChevronDown } from "lucide-react";

interface SearchableDropdownProps {
  options: string[];
  value: string;
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement> & {
      target: { name: string; value: string | FileList };
    }
  ) => void;
  placeholder: string;
  required?: boolean;
  name: string;
}

const SearchableDropdown: FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  required = true,
  name,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const [touched, setTouched] = useState<boolean>(false);

  useEffect(() => {
    setFilteredOptions(
      options.filter((option) =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, options]);

  const handleSelect = (option: string) => {
    onChange({
      target: { name, value: option },
    } as ChangeEvent<HTMLInputElement>);
    setIsOpen(false);
    setSearchTerm("");
    setTouched(true);
  };

  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setTouched(true);
      setIsOpen(false);
    }
  };

  const isInvalid = required && touched && !value;

  return (
    <div className="relative w-ful text-black" onBlur={handleBlur} tabIndex={0}>
      <div
        className={`w-full border rounded p-2 pl-3 bg-white flex items-center justify-between cursor-pointer ${
          isInvalid ? "border-red-500" : ""
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-black" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={20}
          className={`transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
          <input
            type="text"
            className="w-full p-2 border-b bg-white"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
          />
          <ul className="max-h-60 overflow-y-auto">
            {filteredOptions.map((option, index) => (
              <li
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(option)}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
      {isInvalid && (
        <p className="mt-1 text-red-500 text-sm">This field is required</p>
      )}
      <select
        name={name}
        value={value}
        onChange={(e) => handleSelect(e.target.value)}
        required={required}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SearchableDropdown;
