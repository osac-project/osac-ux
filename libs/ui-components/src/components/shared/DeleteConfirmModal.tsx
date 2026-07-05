import React from 'react';
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import { getErrorMessage } from '../../utils/error';

interface DeleteConfirmModalProps {
  resourceName: string;
  resourceKind: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  error?: unknown;
}

export const DeleteConfirmModal = ({
  resourceName,
  resourceKind,
  onConfirm,
  onClose,
  error,
}: DeleteConfirmModalProps) => {
  const [isPending, setIsPending] = React.useState(false);

  const onDelete = async () => {
    setIsPending(true);
    try {
      await onConfirm();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      variant="small"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="delete-confirm-title"
    >
      <ModalHeader
        title={`Delete ${resourceName}?`}
        titleIconVariant="warning"
        labelId="delete-confirm-title"
      />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {`This permanently deletes the ${resourceKind}. This action cannot be undone.`}
          </StackItem>
          {error != null && (
            <StackItem>
              <Alert variant="danger" title={`Failed to delete ${resourceKind}`} isInline>
                {getErrorMessage(error)}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onDelete} isDisabled={isPending} isLoading={isPending}>
          Delete
        </Button>
      </ModalFooter>
    </Modal>
  );
};
