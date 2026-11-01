import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  Title,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';
import MoneyBillIcon from '@patternfly/react-icons/dist/esm/icons/money-bill-icon';

import ListPage from '@osac/ui-components/components/Page/ListPage';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import './TenantBillingPage.css';

const BILLING_PORTAL_URL = 'https://billing.example.com';

const TenantBillingPage = () => {
  const { t } = useTranslation();

  return (
    <ListPage
      className="tenant-billing-page"
      title={t('Billing')}
      label={t('Administration')}
      description={t(
        'Billing account link status and rates for this tenant. Balances and invoices stay in the billing platform.',
      )}
      actions={
        <a
          className="pf-v6-c-button pf-m-primary"
          href={BILLING_PORTAL_URL}
          target="_blank"
          rel="noreferrer"
        >
          <span className="pf-v6-c-button__text">{t('Open billing portal')}</span>
          <span className="pf-v6-c-button__icon pf-m-end">
            <ExternalLinkAltIcon aria-hidden />
          </span>
        </a>
      }
    >
      <Alert
        className="tenant-billing-page__alert"
        variant="info"
        isInline
        title={t('Balances are not shown here')}
      >
        <Content component="p">
          {t('Link status and rates only. Open the billing portal for balances and invoices.')}
        </Content>
      </Alert>

      <Card className="tenant-billing-page__linked-account">
        <CardHeader>
          <CardTitle>{t('Linked billing account')}</CardTitle>
        </CardHeader>
        <CardBody>
          <Title headingLevel="h2" size="2xl">
            north-summit-bank
          </Title>
          <Content component="p">ORG-NSB · North Summit Bank · Production</Content>
          <div className="tenant-billing-page__labels">
            <Label color="green" isCompact>
              {t('Active')}
            </Label>
            <Label color="green" isCompact>
              {t('Approved')}
            </Label>
          </div>
        </CardBody>
      </Card>

      <div className="tenant-billing-page__summary-grid">
        <Card isFullHeight>
          <CardHeader>
            <CardTitle>
              <CheckCircleIcon aria-hidden /> {t('Account status')}
            </CardTitle>
          </CardHeader>
          <CardBody>
            <Title headingLevel="h2" size="2xl">
              {t('Active')}
            </Title>
            <Content component="p">{t('Lifecycle status from the billing platform')}</Content>
          </CardBody>
        </Card>
        <Card isFullHeight>
          <CardHeader>
            <CardTitle>
              <CheckCircleIcon aria-hidden /> {t('Approval')}
            </CardTitle>
          </CardHeader>
          <CardBody>
            <Title headingLevel="h2" size="2xl">
              {t('Approved')}
            </Title>
            <Content component="p">{t('Approval status from the billing platform')}</Content>
          </CardBody>
        </Card>
        <Card isFullHeight>
          <CardHeader>
            <CardTitle>
              <MoneyBillIcon aria-hidden /> {t('Rate card')}
            </CardTitle>
          </CardHeader>
          <CardBody>
            <Title headingLevel="h2" size="2xl">
              {t('Enterprise — US')}
            </Title>
            <Content component="p">{t('United States · 18 rates')}</Content>
          </CardBody>
        </Card>
      </div>

      <div className="tenant-billing-page__details-grid">
        <Card isFullHeight>
          <CardHeader>
            <CardTitle>{t('Account details')}</CardTitle>
          </CardHeader>
          <CardBody>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Account ID')}</DescriptionListTerm>
                <DescriptionListDescription>ACCT-NSB-2048</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Account label')}</DescriptionListTerm>
                <DescriptionListDescription>{t('Production')}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Organization')}</DescriptionListTerm>
                <DescriptionListDescription>ORG-NSB · North Summit Bank</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Linked account')}</DescriptionListTerm>
                <DescriptionListDescription>north-summit-bank</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('External ID')}</DescriptionListTerm>
                <DescriptionListDescription>north-summit-bank</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>

        <Card isFullHeight>
          <CardHeader>
            <CardTitle>{t('Rates on this card')}</CardTitle>
          </CardHeader>
          <CardBody>
            <Content component="p">
              {t('Sample catalog rates. Full pricing stays in the billing platform.')}
            </Content>
            <ul className="tenant-billing-page__rates-list">
              <li>$3.20/hr · $2,150/mo per instance for Bare metal — Small</li>
              <li>$8.50/hr · $5,200/mo per instance for Bare metal — Medium</li>
              <li>$4.25/hr · $2,850/mo per instance for Bare metal — Large</li>
              <li>$6.75/hr · $4,536/mo per instance for Cluster — Control plane</li>
            </ul>
            <Content component="p">{t('+14 more in the billing platform')}</Content>
          </CardBody>
        </Card>

        <Card isFullHeight>
          <CardHeader>
            <CardTitle>{t('Block storage rates')}</CardTitle>
          </CardHeader>
          <CardBody>
            {/* [PREDICTED API] GET /api/fulfillment/v1/storage_usage */}
            {/* No metering/usage endpoint exists yet in the public API. */}
            {/* Rates below are sourced from the billing rate card (mock). */}
            <Content component="p">
              {t(
                'Block storage is billed per GiB-hour. Rates vary by tier. Charges appear in the billing platform.',
              )}
            </Content>
            <Table aria-label={t('Storage rates')} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t('Tier')}</Th>
                  <Th>{t('Protocol')}</Th>
                  <Th>{t('Rate')}</Th>
                  <Th>{t('Billing unit')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>fast</Td>
                  <Td>BLOCK</Td>
                  <Td>$0.000120</Td>
                  <Td>GiB-hour</Td>
                </Tr>
                <Tr>
                  <Td>standard</Td>
                  <Td>BLOCK</Td>
                  <Td>$0.000068</Td>
                  <Td>GiB-hour</Td>
                </Tr>
                <Tr>
                  <Td>archive</Td>
                  <Td>BLOCK</Td>
                  <Td>$0.000022</Td>
                  <Td>GiB-hour</Td>
                </Tr>
              </Tbody>
            </Table>
            <Alert variant="warning" isInline title={t('Sample rates')} style={{ marginTop: 16 }}>
              {t('Rates are sample values from your rate card. Actual charges appear in the billing portal.')}
            </Alert>
          </CardBody>
        </Card>
      </div>
    </ListPage>
  );
};

export default TenantBillingPage;
