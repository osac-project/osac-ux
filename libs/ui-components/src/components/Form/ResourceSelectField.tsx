import { type MouseEvent, type ReactNode, type Ref, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Content,
  Divider,
  FormGroup,
  MenuToggle,
  type MenuToggleElement,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useField } from 'formik';

import type { ListParams } from '@osac/ui-components/api/types';
import { useListResource } from '@osac/ui-components/api/use-resource';
import { getErrorMessage } from '@osac/ui-components/utils/error';

import { getVisibleFieldError } from './fieldError';
import { useShowFieldValidationErrors } from './FieldValidationContext';
import { FormFieldHelper } from './FormFieldHelper';
import { type ResourceSelectValue } from './resourceSelectValue';

import './ResourceSelectField.css';

type ListService = Parameters<typeof useListResource>[0];

export type { ResourceSelectValue } from './resourceSelectValue';
export { emptyResourceSelectValue } from './resourceSelectValue';

export interface ResourceListItem {
  id: string;
  metadata?: { name?: string; displayName?: string; description?: string };
  spec?: { description?: string };
}

export interface ResourceSelectFieldProps {
  name: string;
  label: string;
  fieldId: string;
  service: ListService;
  request?: Pick<ListParams, 'filter' | 'limit'>;
  isRequired?: boolean;
  isDisabled?: boolean;
  labelInfo?: ReactNode;
  placeholder?: string;
  loadingPlaceholder?: string;
  autoSelectSingleOption?: boolean;
  helperText?: string;
  isSearchable?: boolean;
  searchPlaceholder?: string;
  loadErrorTitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Called after a new resource is selected. Use to trigger cascade resets. */
  onSelectResource?: (value: ResourceSelectValue) => void;
}

const resourceFromItem = (item: ResourceListItem): ResourceSelectValue => ({
  id: item.id,
  name: item.metadata?.name ?? '',
});

const resourceDescription = (item: ResourceListItem): string | undefined =>
  item.metadata?.description || item.spec?.description;

export const ResourceSelectField = ({
  name,
  label,
  fieldId,
  service,
  request,
  isRequired = false,
  isDisabled = false,
  labelInfo,
  placeholder = '',
  loadingPlaceholder = 'Loading...',
  autoSelectSingleOption = false,
  helperText,
  isSearchable = false,
  searchPlaceholder = 'Search',
  loadErrorTitle,
  emptyTitle,
  emptyDescription,
  onSelectResource,
}: ResourceSelectFieldProps) => {
  const [field, meta, helpers] = useField<ResourceSelectValue>(name);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const showValidationErrors = useShowFieldValidationErrors();
  const error = getVisibleFieldError(meta, showValidationErrors);
  const { data, isLoading, error: loadError } = useListResource(service, request);
  const items = useMemo(
    () =>
      ((data as { items?: ResourceListItem[] } | undefined)?.items ?? []).filter((item) => item.id),
    [data],
  );
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return items;
    }
    return items.filter((item) =>
      [item.metadata?.name, item.metadata?.displayName, resourceDescription(item)]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [items, search]);

  const listFailed = Boolean(loadError);
  const listEmpty = !isLoading && !listFailed && items.length === 0;
  const controlDisabled = isDisabled || isLoading || listFailed || listEmpty;
  const effectivePlaceholder = isLoading ? loadingPlaceholder : placeholder;
  const selectedId = field.value?.id ?? '';
  const selectedItem = items.find((item) => item.id === selectedId);
  const selectedName =
    selectedItem?.metadata?.displayName || selectedItem?.metadata?.name || field.value?.name;
  const selectedDescription = selectedItem ? resourceDescription(selectedItem) : undefined;
  const validated = error ? 'error' : 'default';

  useEffect(() => {
    if (
      !autoSelectSingleOption ||
      isLoading ||
      controlDisabled ||
      items.length !== 1 ||
      selectedId !== ''
    ) {
      return;
    }
    void helpers.setValue(resourceFromItem(items[0]), false);
  }, [autoSelectSingleOption, controlDisabled, helpers, isLoading, items, selectedId]);

  const onSelect = (_event: MouseEvent<Element> | undefined, value: string | number) => {
    const item = items.find((resource) => resource.id === value);
    if (!item) {
      return;
    }
    const resourceValue = resourceFromItem(item);
    void helpers.setValue(resourceValue, true);
    void helpers.setTouched(true, false);
    setIsOpen(false);
    setSearch('');
    onSelectResource?.(resourceValue);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearch('');
    }
  };

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      id={fieldId}
      className="resource-select__toggle"
      onClick={() => setIsOpen((wasOpen) => !wasOpen)}
      isExpanded={isOpen}
      isDisabled={controlDisabled}
      isFullWidth
      status={validated === 'error' ? 'danger' : undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${fieldId}-helper-error` : undefined}
      aria-busy={isLoading || undefined}
    >
      {selectedName ? (
        <Stack className="resource-select__toggle-content">
          <StackItem className="resource-select__toggle-name">{selectedName}</StackItem>
          {selectedDescription ? (
            <StackItem className="resource-select__toggle-description">
              {selectedDescription}
            </StackItem>
          ) : null}
        </Stack>
      ) : (
        effectivePlaceholder
      )}
    </MenuToggle>
  );

  return (
    <>
      {listFailed ? (
        <Alert variant="danger" isInline title={loadErrorTitle}>
          {getErrorMessage(loadError)}
        </Alert>
      ) : null}
      {listEmpty && emptyTitle ? (
        <Alert variant="warning" isInline title={emptyTitle}>
          {emptyDescription ? <Content component="p">{emptyDescription}</Content> : null}
        </Alert>
      ) : null}
      <FormGroup label={label} fieldId={fieldId} isRequired={isRequired} labelInfo={labelInfo}>
        <Select
          id={`${fieldId}-select`}
          isOpen={isOpen}
          selected={selectedId}
          onSelect={onSelect}
          onOpenChange={handleOpenChange}
          toggle={toggle}
          shouldFocusToggleOnSelect
        >
          {isSearchable ? (
            <div className="resource-select__menu">
              <SearchInput
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
                value={search}
                onChange={(_event, value) => setSearch(value)}
                onClear={() => setSearch('')}
              />
              <Divider />
              <SelectList>
                {filteredItems.map((item) => (
                  <SelectOption
                    key={item.id}
                    value={item.id}
                    description={resourceDescription(item)}
                  >
                    {item.metadata?.displayName || item.metadata?.name}
                  </SelectOption>
                ))}
              </SelectList>
            </div>
          ) : (
            <SelectList>
              {filteredItems.map((item) => (
                <SelectOption key={item.id} value={item.id} description={resourceDescription(item)}>
                  {item.metadata?.displayName || item.metadata?.name}
                </SelectOption>
              ))}
            </SelectList>
          )}
        </Select>
        <FormFieldHelper error={error} description={helperText} fieldId={fieldId} />
      </FormGroup>
    </>
  );
};
