import { useState } from 'react';
import { MenuToggle, Select, SelectList, SelectOption } from '@patternfly/react-core';

import './VmListFilterSelect.css';

export interface VmListFilterOption<T extends string = string> {
  value: T;
  label: string;
}

interface VmListFilterSelectProps<T extends string> {
  allLabel: string;
  ariaLabel: string;
  options: readonly VmListFilterOption<T>[];
  selected: readonly T[];
  onToggle: (value: T) => void;
}

const VmListFilterSelect = <T extends string>({
  allLabel,
  ariaLabel,
  options,
  selected,
  onToggle,
}: VmListFilterSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const label = selected.length === 0 ? allLabel : `${allLabel} (${selected.length})`;

  return (
    <Select
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onSelect={(_event, value) => {
        if (typeof value === 'string' && options.some((option) => option.value === value)) {
          onToggle(value as T);
        }
      }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          aria-label={ariaLabel}
          className="vm-list-filter-select__toggle"
          isExpanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          {label}
        </MenuToggle>
      )}
      shouldFocusToggleOnSelect
    >
      <SelectList>
        {options.map((option) => (
          <SelectOption
            key={option.value}
            value={option.value}
            hasCheckbox
            isSelected={selected.includes(option.value)}
          >
            {option.label}
          </SelectOption>
        ))}
      </SelectList>
    </Select>
  );
};

export default VmListFilterSelect;
