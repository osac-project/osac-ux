import React from 'react';
import { Alert, Button, Modal, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core';

import type { SecurityGroup } from '@osac/types';
import { Protocol } from '@osac/types';

import { SecurityRulesFields } from './SecurityRulesFields';
import type { SecurityRuleInput } from '../../api/v1/networking';
import { usePatchSecurityGroup } from '../../api/v1/networking';
import { resourceDisplayName } from '../../api/v1/networking';
import { getErrorMessage } from '../../utils/error';
import OsacForm from '../Form/OsacForm';

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

interface SecurityGroupManageRulesModalProps {
  sg: SecurityGroup;
  onClose: () => void;
}

export const SecurityGroupManageRulesModal = ({
  sg,
  onClose,
}: SecurityGroupManageRulesModalProps) => {
  const [ingress, setIngress] = React.useState<SecurityRuleInput[]>(() =>
    (sg.spec?.ingress ?? []).map(toRuleInput),
  );
  const [egress, setEgress] = React.useState<SecurityRuleInput[]>(() =>
    (sg.spec?.egress ?? []).map(toRuleInput),
  );
  const [isPending, setIsPending] = React.useState(false);

  const patchSG = usePatchSecurityGroup();

  const onSave = async () => {
    setIsPending(true);
    patchSG.reset();
    try {
      await patchSG.mutateAsync({ id: sg.id, ingress, egress });
      onClose();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      variant="large"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="sg-rules-title"
    >
      <ModalHeader
        title={`Manage rules — ${resourceDisplayName(sg.metadata, sg.id)}`}
        labelId="sg-rules-title"
      />
      <ModalBody>
        <OsacForm isResponsive={false}>
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
        </OsacForm>
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onSave} isDisabled={isPending} isLoading={isPending}>
          Save rules
        </Button>
      </ModalFooter>
    </Modal>
  );
};
