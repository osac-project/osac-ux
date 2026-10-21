import { type CSSProperties, type ReactNode, useState } from 'react';
import {
  Alert,
  Divider,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  Skeleton,
} from '@patternfly/react-core';

import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import './HierarchicalSelect.css';

export interface HierarchicalSelectItem {
  /** Unique identifier used as the selection value */
  id: string;
  /** Display label */
  label: string;
  /** 0 = root, 1 = first-level child, etc. */
  depth: number;
}

interface HierarchicalSelectProps {
  id?: string;
  'aria-label': string;
  /**
   * Pre-ordered flat tree list — callers are responsible for sorting and
   * computing depth before passing items in. Use `buildProjectTree` for projects.
   */
  items: HierarchicalSelectItem[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  /** Text shown in the toggle when nothing is selected */
  placeholder: string;
  /** Label for the "clear all" option at the top of the list */
  clearLabel: string;
  /** Optional icon shown next to the clear-all option */
  clearIcon?: ReactNode;
  isLoading?: boolean;
  /** Human-readable error string — renders an inline danger alert */
  error?: string;
}

const CLEAR_SENTINEL = '__hierarchical-select-clear__';

export const HierarchicalSelect = ({
  id,
  'aria-label': ariaLabel,
  items,
  selectedIds,
  onSelectionChange,
  placeholder,
  clearLabel,
  clearIcon,
  isLoading = false,
  error,
}: HierarchicalSelectProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleLabel =
    selectedIds.length > 0
      ? selectedIds
          .map((sid) => items.find((item) => item.id === sid)?.label ?? sid)
          .join(', ')
      : placeholder;

  const handleSelect = (_: React.MouseEvent | undefined, value: string | number | undefined) => {
    if (value === CLEAR_SENTINEL) {
      onSelectionChange([]);
      setIsOpen(false);
      return;
    }
    if (typeof value !== 'string') return;
    onSelectionChange(
      selectedIds.includes(value)
        ? selectedIds.filter((s) => s !== value)
        : [...selectedIds, value],
    );
  };

  return (
    <Select
      id={id}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onSelect={handleSelect}
      toggle={(ref) => (
        <MenuToggle
          ref={ref}
          isExpanded={isOpen}
          isFullWidth
          onClick={() => setIsOpen((o) => !o)}
          aria-label={ariaLabel}
        >
          <span className="hierarchical-select__toggle-label">{toggleLabel}</span>
        </MenuToggle>
      )}
      shouldFocusToggleOnSelect
      aria-label={ariaLabel}
    >
      <SelectList>
        <SelectOption value={CLEAR_SENTINEL} icon={clearIcon}>
          {clearLabel}
        </SelectOption>
        <Divider />

        {isLoading ? (
          <>
            <SelectOption isDisabled>
              <Skeleton />
            </SelectOption>
            <SelectOption isDisabled>
              <Skeleton />
            </SelectOption>
            <SelectOption isDisabled>
              <Skeleton />
            </SelectOption>
          </>
        ) : error ? (
          <Alert title={t('Failed to load items')} variant="danger" isInline>
            {error}
          </Alert>
        ) : (
          items.map((item) => (
            <SelectOption
              key={item.id}
              value={item.id}
              hasCheckbox
              isSelected={selectedIds.includes(item.id)}
            >
              <span
                className="hierarchical-select__label"
                style={{ '--hierarchical-select-depth': item.depth } as CSSProperties}
              >
                {item.label}
              </span>
            </SelectOption>
          ))
        )}
      </SelectList>
    </Select>
  );
};
