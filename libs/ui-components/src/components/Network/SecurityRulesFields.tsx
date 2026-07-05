import React from 'react';
import {
  Button,
  FormGroup,
  MenuToggle,
  Select,
  SelectOption,
  TextInput,
} from '@patternfly/react-core';
import type { MenuToggleElement } from '@patternfly/react-core';

import { Protocol } from '@osac/types';

import type { SecurityRuleInput } from '../../api/v1/networking';

import styles from '../../styles/components.module.css';

const PROTOCOL_OPTIONS: { value: Protocol; label: string }[] = [
  { value: Protocol.TCP, label: 'TCP' },
  { value: Protocol.UDP, label: 'UDP' },
  { value: Protocol.ICMP, label: 'ICMP' },
  { value: Protocol.ALL, label: 'All' },
];

const protocolLabel = (protocol: Protocol): string =>
  PROTOCOL_OPTIONS.find((o) => o.value === protocol)?.label ?? 'TCP';

const needsPorts = (protocol: Protocol): boolean =>
  protocol === Protocol.TCP || protocol === Protocol.UDP;

interface RuleRowProps {
  rule: SecurityRuleInput;
  index: number;
  onUpdate: (index: number, updated: SecurityRuleInput) => void;
  onRemove: (index: number) => void;
}

const RuleRow = ({ rule, index, onUpdate, onRemove }: RuleRowProps) => {
  const [protocolOpen, setProtocolOpen] = React.useState(false);
  const protocol = (rule.protocol as Protocol) ?? Protocol.TCP;
  const showPorts = needsPorts(protocol);

  return (
    <div className={styles.networkRuleRow}>
      <FormGroup label={index === 0 ? 'Protocol' : undefined} fieldId={`rule-protocol-${index}`}>
        <Select
          isOpen={protocolOpen}
          selected={protocol}
          onSelect={(_, value) => {
            onUpdate(index, { ...rule, protocol: value as Protocol });
            setProtocolOpen(false);
          }}
          onOpenChange={setProtocolOpen}
          toggle={(ref: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={ref}
              onClick={() => setProtocolOpen(!protocolOpen)}
              isExpanded={protocolOpen}
              style={{ width: '100%' }}
            >
              {protocolLabel(protocol)}
            </MenuToggle>
          )}
        >
          {PROTOCOL_OPTIONS.map((opt) => (
            <SelectOption key={opt.value} value={opt.value}>
              {opt.label}
            </SelectOption>
          ))}
        </Select>
      </FormGroup>

      <FormGroup label={index === 0 ? 'Port from' : undefined} fieldId={`rule-port-from-${index}`}>
        <TextInput
          id={`rule-port-from-${index}`}
          type="number"
          value={showPorts ? (rule.portFrom ?? '') : ''}
          isDisabled={!showPorts}
          placeholder={showPorts ? '1' : '—'}
          onChange={(_e, v) =>
            onUpdate(index, { ...rule, portFrom: v ? parseInt(v, 10) : undefined })
          }
        />
      </FormGroup>

      <FormGroup label={index === 0 ? 'Port to' : undefined} fieldId={`rule-port-to-${index}`}>
        <TextInput
          id={`rule-port-to-${index}`}
          type="number"
          value={showPorts ? (rule.portTo ?? '') : ''}
          isDisabled={!showPorts}
          placeholder={showPorts ? '65535' : '—'}
          onChange={(_e, v) =>
            onUpdate(index, { ...rule, portTo: v ? parseInt(v, 10) : undefined })
          }
        />
      </FormGroup>

      <FormGroup label={index === 0 ? 'CIDR' : undefined} fieldId={`rule-cidr-${index}`}>
        <TextInput
          id={`rule-cidr-${index}`}
          value={rule.ipv4Cidr ?? ''}
          placeholder="0.0.0.0/0"
          onChange={(_e, v) => onUpdate(index, { ...rule, ipv4Cidr: v })}
        />
      </FormGroup>

      <FormGroup label={index === 0 ? ' ' : undefined} fieldId={`rule-remove-${index}`}>
        <Button variant="plain" aria-label="Remove rule" onClick={() => onRemove(index)}>
          ×
        </Button>
      </FormGroup>
    </div>
  );
};

interface SecurityRulesFieldsProps {
  label: string;
  rules: SecurityRuleInput[];
  onChange: (rules: SecurityRuleInput[]) => void;
}

const emptyRule = (): SecurityRuleInput => ({ protocol: Protocol.TCP, ipv4Cidr: '0.0.0.0/0' });

export const SecurityRulesFields = ({ label, rules, onChange }: SecurityRulesFieldsProps) => {
  const handleUpdate = (index: number, updated: SecurityRuleInput) => {
    const next = [...rules];
    next[index] = updated;
    onChange(next);
  };

  const handleRemove = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  return (
    <div>
      <FormGroup label={label} fieldId={`rules-${label}`} />
      {rules.map((rule, i) => (
        <RuleRow key={i} rule={rule} index={i} onUpdate={handleUpdate} onRemove={handleRemove} />
      ))}
      <Button variant="link" isInline onClick={() => onChange([...rules, emptyRule()])}>
        + Add rule
      </Button>
    </div>
  );
};
