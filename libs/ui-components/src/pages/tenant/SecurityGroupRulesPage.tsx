/**
 * flow: manage-networking
 * route: /networks/security-groups/:id/rules
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  PageSection,
  Spinner,
  Stack,
  Title,
} from '@patternfly/react-core';

import { Protocol } from '@osac/types';

import {
  resourceDisplayName,
  usePatchSecurityGroup,
  useSecurityGroup,
} from '../../api/v1/networking';
import type { SecurityRuleInput } from '../../api/v1/networking';
import OsacForm from '../../components/Form/OsacForm';
import { SecurityRulesFields } from '../../components/Network/SecurityRulesFields';
import { getErrorMessage } from '../../utils/error';

const toRuleInput = (rule: {
  protocol?: number;
  portFrom?: number;
  portTo?: number;
  ipv4Cidr?: string;
}): SecurityRuleInput => ({
  protocol: rule.protocol ?? Protocol.TCP,
  portFrom: rule.portFrom,
  portTo: rule.portTo,
  ipv4Cidr: rule.ipv4Cidr,
});

export const SecurityGroupRulesPage = () => {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data: sg, isLoading } = useSecurityGroup(id);
  const patchSG = usePatchSecurityGroup();

  const [ingress, setIngress] = React.useState<SecurityRuleInput[]>([]);
  const [egress, setEgress] = React.useState<SecurityRuleInput[]>([]);
  const [initialized, setInitialized] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  React.useEffect(() => {
    if (sg && !initialized) {
      setIngress((sg.spec?.ingress ?? []).map(toRuleInput));
      setEgress((sg.spec?.egress ?? []).map(toRuleInput));
      setInitialized(true);
    }
  }, [sg, initialized]);

  const sgName = sg ? resourceDisplayName(sg.metadata, sg.id) : id;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    patchSG.reset();
    try {
      await patchSG.mutateAsync({ id, ingress, egress });
      navigate('/networks?tab=security-groups');
    } finally {
      setIsPending(false);
    }
  };

  if (isLoading) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Spinner aria-label="Loading security group" />
      </PageSection>
    );
  }

  if (!sg) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Alert variant="warning" isInline title={`Security group not found: ${id}`}>
          <Button variant="link" onClick={() => navigate('/networks?tab=security-groups')}>
            Back to Security Groups
          </Button>
        </Alert>
      </PageSection>
    );
  }

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button
                variant="link"
                isInline
                onClick={() => navigate('/networks?tab=security-groups')}
              >
                Networks
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{sgName} — Rules</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            Manage rules — {sgName}
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <OsacForm
          isResponsive={false}
          style={{ maxWidth: '720px' }}
          onSubmit={onSubmit}
          id="sg-rules-form"
        >
          <SecurityRulesFields
            label="Inbound rules (ingress)"
            rules={ingress}
            onChange={setIngress}
          />
          <SecurityRulesFields
            label="Outbound rules (egress)"
            rules={egress}
            onChange={setEgress}
          />

          {patchSG.error && (
            <Alert variant="danger" title="Failed to save rules" isInline>
              {getErrorMessage(patchSG.error)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="sg-rules-form"
              isLoading={isPending}
              isDisabled={isPending}
            >
              Save rules
            </Button>
            <Button
              variant="link"
              onClick={() => navigate('/networks?tab=security-groups')}
              isDisabled={isPending}
            >
              Cancel
            </Button>
          </ActionGroup>
        </OsacForm>
      </PageSection>
    </>
  );
};
