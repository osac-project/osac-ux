import { useState } from 'react';
import { MenuToggle, Select, SelectList, SelectOption } from '@patternfly/react-core';

import { useTranslation } from '../../hooks/useTranslation';

interface ClusterVersionFilterProps {
  selectedVersions: string[];
  versions: string[];
  onToggle: (version: string) => void;
}

const ClusterVersionFilter = ({
  selectedVersions,
  versions,
  onToggle,
}: ClusterVersionFilterProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Select
      role="menu"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onSelect={(_event, value) => {
        if (typeof value === 'string') {
          onToggle(value);
        }
      }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          aria-label={t('Filter clusters by version')}
          onClick={() => setIsOpen((open) => !open)}
          isExpanded={isOpen}
          className="clusters-page__version-toggle"
        >
          {selectedVersions.length === 0
            ? t('All versions')
            : selectedVersions.map((version) => `OpenShift ${version}`).join(', ')}
        </MenuToggle>
      )}
      shouldFocusToggleOnSelect
    >
      <SelectList>
        {versions.map((version) => (
          <SelectOption
            key={version}
            value={version}
            hasCheckbox
            isSelected={selectedVersions.includes(version)}
          >
            {`OpenShift ${version}`}
          </SelectOption>
        ))}
      </SelectList>
    </Select>
  );
};

export default ClusterVersionFilter;
