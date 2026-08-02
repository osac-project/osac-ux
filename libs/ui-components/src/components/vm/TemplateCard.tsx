import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Divider,
  Flex,
  FlexItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import { useTranslation } from '../../hooks/useTranslation';
import { GuestOsIcon, type OsType } from '../shared/GuestOsIcon';

import './TemplateCard.css';

/** Legacy template card display shape (demo extras until template list migrates to wire types). */
export type TemplateCardDisplay = {
  id: string;
  title: string;
  description?: string;
  metadata: { name: string };
  workload?: string;
  workloadProfile?: 'high-performance' | 'analytics' | 'machine-learning' | 'data-processing';
  defaultCores?: number;
  defaultMemoryGib?: number;
  defaultBootDiskSizeGib?: number;
  icon?: string;
};

interface TemplateCardProps {
  template: TemplateCardDisplay;
}

const subtitleForTemplate = (template: TemplateCardDisplay): string => {
  if (template.description && template.description.trim().length > 0) {
    return template.description;
  }
  return template.metadata.name;
};

const workloadLabel = (
  t: (key: string, options?: Record<string, unknown>) => string,
  template: TemplateCardDisplay,
): string => {
  if (!template.workloadProfile) {
    return template.workload ?? t('General');
  }
  if (template.workloadProfile === 'high-performance') {
    return t('High performance');
  }
  if (template.workloadProfile === 'machine-learning') {
    return t('Machine learning');
  }
  if (template.workloadProfile === 'data-processing') {
    return t('Data processing');
  }
  return t('Analytics');
};

export const TemplateCard = ({ template }: TemplateCardProps) => {
  const { t } = useTranslation();
  const cpu = `${template.defaultCores ?? 2} vCPU`;
  const memory = `${template.defaultMemoryGib ?? 8} GiB`;
  const diskGib = template.defaultBootDiskSizeGib ?? 40;
  const storage = `${diskGib} GiB`;
  const workload = workloadLabel(t, template);
  const subtitle = subtitleForTemplate(template);

  return (
    <Card isClickable isFullHeight className="tenant-vm-template-card">
      <CardHeader className="tenant-vm-template-card__header">
        <CardTitle className="tenant-vm-template-card__title-block">
          <Flex
            alignItems={{ default: 'alignItemsFlexStart' }}
            spaceItems={{ default: 'spaceItemsXs' }}
          >
            <FlexItem className="tenant-vm-template-card__icon-tile">
              <GuestOsIcon os={(template.icon ?? 'linux') as OsType} size="lg" />
            </FlexItem>
            <FlexItem>
              <Stack hasGutter>
                <StackItem>
                  <Content component="h3" className="tenant-vm-template-card__title">
                    {template.title}
                  </Content>
                </StackItem>
                <StackItem>
                  <Content component="small" className="tenant-vm-template-card__subtitle">
                    {subtitle}
                  </Content>
                </StackItem>
              </Stack>
            </FlexItem>
          </Flex>
        </CardTitle>
      </CardHeader>
      <CardBody className="tenant-vm-template-card__body">
        <Stack hasGutter>
          <StackItem>
            <Flex
              className="tenant-vm-template-card__resource-row"
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
            >
              <FlexItem>{cpu}</FlexItem>
              <FlexItem>{memory}</FlexItem>
              <FlexItem>{storage}</FlexItem>
            </Flex>
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
          <StackItem>
            <Content component="small" className="tenant-vm-template-card__workload-line">
              {t('Workload: {{workload}}', { workload })}
            </Content>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};
