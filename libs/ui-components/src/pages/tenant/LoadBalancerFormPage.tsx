/**
 * flow: load-balancers
 * route: /load-balancers/new          (create)
 * route: /load-balancers/:id/edit     (edit)
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Form,
  FormGroup,
  MenuToggle,
  PageSection,
  Select,
  SelectList,
  SelectOption,
  Stack,
  TextInput,
  Title,
} from '@patternfly/react-core';

import {
  type LoadBalancer,
  type LoadBalancerListener,
  useCreateLoadBalancer,
  useLoadBalancers,
  usePatchLoadBalancer,
} from '../../api/v1/load-balancer';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

const PROTOCOLS = ['HTTP', 'HTTPS', 'TCP', 'UDP'] as const;
const defaultListener = (): LoadBalancerListener => ({
  protocol: 'HTTP',
  port: 80,
  targetPort: 8080,
});

const ListenerRow = ({
  listener,
  index,
  total,
  onChange,
  onRemove,
}: {
  listener: LoadBalancerListener;
  index: number;
  total: number;
  onChange: <K extends keyof LoadBalancerListener>(key: K, value: LoadBalancerListener[K]) => void;
  onRemove: () => void;
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
      <Select
        isOpen={open}
        onSelect={(_e, val) => {
          onChange('protocol', val as LoadBalancerListener['protocol']);
          setOpen(false);
        }}
        onOpenChange={setOpen}
        selected={listener.protocol}
        toggle={(ref) => (
          <MenuToggle
            ref={ref}
            onClick={() => setOpen((o) => !o)}
            isExpanded={open}
            style={{ minWidth: '90px' }}
          >
            {listener.protocol}
          </MenuToggle>
        )}
      >
        <SelectList>
          {PROTOCOLS.map((p) => (
            <SelectOption key={p} value={p}>
              {p}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
      <TextInput
        aria-label={t('Listener {{number}} port', { number: index + 1 })}
        type="number"
        value={listener.port}
        onChange={(_e, v) => onChange('port', parseInt(v, 10) || 0)}
        placeholder={t('Port')}
        style={{ width: '100px' }}
      />
      <span style={{ color: 'var(--pf-t--global--color--200)' }}>→</span>
      <TextInput
        aria-label={t('Listener {{number}} target port', { number: index + 1 })}
        type="number"
        value={listener.targetPort}
        onChange={(_e, v) => onChange('targetPort', parseInt(v, 10) || 0)}
        placeholder={t('Target port')}
        style={{ width: '120px' }}
      />
      {total > 1 && (
        <Button variant="plain" aria-label={t('Remove listener')} onClick={onRemove}>
          ✕
        </Button>
      )}
    </div>
  );
};

export const LoadBalancerFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const { data: lbs = [] } = useLoadBalancers();
  const existing: LoadBalancer | undefined = id ? lbs.find((lb) => lb.id === id) : undefined;

  const [name, setName] = useState('');
  const [virtualNetwork, setVirtualNetwork] = useState('');
  const [subnet, setSubnet] = useState('');
  const [description, setDescription] = useState('');
  const [listeners, setListeners] = useState<LoadBalancerListener[]>([defaultListener()]);

  // Pre-populate when editing
  useEffect(() => {
    if (existing) {
      setName(existing.metadata?.name ?? '');
      setVirtualNetwork(existing.spec.virtualNetwork);
      setSubnet(existing.spec.subnet);
      setDescription(existing.spec.description ?? '');
      setListeners(
        existing.spec.listeners.length > 0 ? existing.spec.listeners : [defaultListener()],
      );
    }
  }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = useCreateLoadBalancer();
  const patch = usePatchLoadBalancer();

  const mutation = isEdit ? patch : create;
  const isPending = mutation.isPending;
  const mutationError = mutation.error;

  const isValid = !!(name.trim() && virtualNetwork.trim() && subnet.trim() && listeners.length > 0);

  const updateListener = <K extends keyof LoadBalancerListener>(
    idx: number,
    key: K,
    value: LoadBalancerListener[K],
  ) => setListeners((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    const specPayload = {
      virtualNetwork: virtualNetwork.trim(),
      subnet: subnet.trim(),
      listeners,
      description: description.trim() || undefined,
    };
    if (isEdit && id) {
      await patch.mutateAsync({
        id,
        patch: { metadata: { name: name.trim() }, spec: specPayload },
      });
    } else {
      await create.mutateAsync({ metadata: { name: name.trim() }, spec: specPayload });
    }
    navigate('/load-balancers');
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/load-balancers')}>
                {t('Load Balancers')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>
              {isEdit
                ? t('Edit {{name}}', { name: existing?.metadata?.name ?? id })
                : t('Create load balancer')}
            </BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {isEdit ? t('Edit load balancer') : t('Create load balancer')}
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '560px' }} id="lb-form">
          <FormGroup label={t('Name')} isRequired fieldId="lb-name">
            <TextInput
              id="lb-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              placeholder="my-load-balancer"
              isRequired
              autoFocus={!isEdit}
            />
          </FormGroup>

          <FormGroup label={t('Virtual network')} isRequired fieldId="lb-vnet">
            <TextInput
              id="lb-vnet"
              value={virtualNetwork}
              onChange={(_e, v) => setVirtualNetwork(v)}
              placeholder="vnet-id"
              isRequired
              isDisabled={isEdit}
            />
          </FormGroup>

          <FormGroup label={t('Subnet')} isRequired fieldId="lb-subnet">
            <TextInput
              id="lb-subnet"
              value={subnet}
              onChange={(_e, v) => setSubnet(v)}
              placeholder="subnet-id"
              isRequired
              isDisabled={isEdit}
            />
          </FormGroup>

          <FormGroup label={t('Description')} fieldId="lb-desc">
            <TextInput
              id="lb-desc"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              placeholder={t('Optional description')}
            />
          </FormGroup>

          <FormGroup label={t('Listeners')} fieldId="lb-listeners">
            {listeners.map((l, idx) => (
              <ListenerRow
                key={idx}
                listener={l}
                index={idx}
                total={listeners.length}
                onChange={(key, value) => updateListener(idx, key, value)}
                onRemove={() => setListeners((prev) => prev.filter((_, i) => i !== idx))}
              />
            ))}
            <Button
              variant="link"
              onClick={() => setListeners((prev) => [...prev, defaultListener()])}
            >
              {t('+ Add listener')}
            </Button>
          </FormGroup>

          {mutationError && (
            <Alert
              variant="danger"
              isInline
              title={isEdit ? t('Failed to update') : t('Failed to create')}
            >
              {getErrorMessage(mutationError)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="lb-form"
              isLoading={isPending}
              isDisabled={isPending || !isValid}
            >
              {isEdit ? t('Save changes') : t('Create')}
            </Button>
            <Button
              variant="link"
              onClick={() => navigate('/load-balancers')}
              isDisabled={isPending}
            >
              {t('Cancel')}
            </Button>
          </ActionGroup>
        </Form>
      </PageSection>
    </>
  );
};
