import type { KeyboardEvent } from 'react';
import {
  Button,
  Card,
  CardBody,
  Content,
  Flex,
  FlexItem,
  FormSection,
  Label,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import MinusCircleIcon from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import PlusCircleIcon from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { FieldArray, useFormikContext } from 'formik';

import { IPFamily } from '@osac/types/private';
import { InputField } from '@osac/ui-components/components/Form/InputField';
import OsacForm from '@osac/ui-components/components/Form/OsacForm';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import type { ExternalIpPoolFormValues } from './values';

import './AddressingStep.css';

const ipFamilyOptions = [
  {
    value: IPFamily.IP_FAMILY_IPV4,
    label: 'IPv4',
    description: 'Default. Use for standard internet-facing tenant services.',
    example: '203.0.113.0/26',
  },
  {
    value: IPFamily.IP_FAMILY_IPV6,
    label: 'IPv6',
    description: 'Use only when your edge network and tenants support IPv6.',
    example: '2001:db8::/32',
  },
] as const;

const AddressingStep = () => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ExternalIpPoolFormValues>();
  const handleFamilyChange = (ipFamily: IPFamily) => {
    void setFieldValue('ipFamily', ipFamily);
  };
  const handleFamilyKeyDown = (event: KeyboardEvent<HTMLElement>, ipFamily: IPFamily) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleFamilyChange(ipFamily);
    }
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="lg">
          {t('Addressing')}
        </Title>
      </StackItem>
      <StackItem>
        <Content component="p">
          {t('Choose the IP family and CIDR ranges for tenant edge exposure.')}
        </Content>
      </StackItem>
      <StackItem>
        <OsacForm>
          <FormSection
            title={
              <>
                {t('IP family')}{' '}
                <span className="pf-v6-c-form__label-required" aria-hidden="true">
                  *
                </span>
              </>
            }
          >
            <div
              className="external-ip-pool-addressing__family-options"
              role="radiogroup"
              aria-label={t('IP family')}
              aria-required="true"
            >
              {ipFamilyOptions.map((option) => {
                const isSelected = values.ipFamily === option.value;
                return (
                  <Card
                    key={option.value}
                    className={`external-ip-pool-addressing__family-card${
                      isSelected ? ' external-ip-pool-addressing__family-card--selected' : ''
                    }`}
                    isSelected={isSelected}
                    onClick={() => handleFamilyChange(option.value)}
                    onKeyDown={(event) => handleFamilyKeyDown(event, option.value)}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={t(option.label)}
                    tabIndex={0}
                  >
                    <CardBody>
                      <Stack className="external-ip-pool-addressing__family-card-content">
                        <StackItem>
                          <Flex
                            justifyContent={{ default: 'justifyContentSpaceBetween' }}
                            alignItems={{ default: 'alignItemsCenter' }}
                          >
                            <FlexItem className="external-ip-pool-addressing__family-card-title">
                              {t(option.label)}
                            </FlexItem>
                            {isSelected ? (
                              <FlexItem>
                                <Label isCompact variant="outline">
                                  {t('Selected')}
                                </Label>
                              </FlexItem>
                            ) : null}
                          </Flex>
                        </StackItem>
                        <StackItem className="external-ip-pool-addressing__family-card-description">
                          {t(option.description)}
                        </StackItem>
                        <StackItem className="external-ip-pool-addressing__family-card-example">
                          {option.example}
                        </StackItem>
                      </Stack>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </FormSection>
          <FormSection
            title={
              <>
                {t('CIDR')}{' '}
                <span className="pf-v6-c-form__label-required" aria-hidden="true">
                  *
                </span>
              </>
            }
          >
            <FieldArray name="cidrs">
              {(helpers) => (
                <Stack hasGutter>
                  {values.cidrs.map((_cidr, index) => (
                    <StackItem key={index}>
                      <InputField
                        name={`cidrs.${index}`}
                        label={t('CIDR {{number}}', { number: index + 1 })}
                        fieldId={`external-ip-pool-cidr-${index}`}
                        placeholder="10.128.0.0/14"
                        asFormGroup={false}
                      >
                        {values.cidrs.length > 1 && (
                          <Button
                            variant="plain"
                            aria-label={t('Remove CIDR {{number}}', { number: index + 1 })}
                            onClick={() => helpers.remove(index)}
                            icon={<MinusCircleIcon />}
                          />
                        )}
                      </InputField>
                    </StackItem>
                  ))}
                  <StackItem>
                    <Button
                      variant="link"
                      icon={<PlusCircleIcon />}
                      onClick={() => helpers.push('')}
                    >
                      {t('Add CIDR')}
                    </Button>
                  </StackItem>
                </Stack>
              )}
            </FieldArray>
          </FormSection>
        </OsacForm>
      </StackItem>
    </Stack>
  );
};

export default AddressingStep;
