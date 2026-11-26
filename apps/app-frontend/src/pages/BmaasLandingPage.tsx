import {
  Brand,
  Bullseye,
  Button,
  Card,
  CardBody,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  List,
  ListItem,
  SearchInput,
  Title,
} from '@patternfly/react-core'
import { css } from '@patternfly/react-styles'
import alignmentStyles from '@patternfly/react-styles/css/utilities/Alignment/alignment'
import { BlueprintIcon } from '@patternfly/react-icons/dist/esm/icons/blueprint-icon'
import { useState } from 'react'
import { ViewModeToggle } from '../components/catalog/CatalogViewToggle'
import { CatalogFilterEmptyState } from '../components/catalog/CatalogFilterEmptyState'
import { RouterButton } from '../components/RouterButton'
import type { ViewMode } from '../catalog/viewMode'
import { BMAAS_LANDING_LAST_UPDATED } from '../bmaasLandingLastUpdated'
import redHatHatLogoUrl from '../assets/Logo-RedHat-Hat-Color-RGB.svg?url'

/**
 * The golden-pattern Storybook is a separate app, so it is reached differently
 * depending on how this page is being served:
 *
 * - production (`build:mock` → GitHub Pages): the CI job builds Storybook into
 *   `dist/storybook`, so it sits under this site's base path.
 * - development (`vite dev`): nothing serves `/storybook/` from this dev
 *   server, and it cannot be proxied — the Storybook preview iframe requests
 *   `/@vite/client` at the origin root, which would collide with this app's
 *   own Vite client. So point straight at the Storybook dev server, which
 *   `pnpm dev` starts alongside this one.
 */
const STORYBOOK_URL = import.meta.env.DEV
  ? 'http://localhost:6006/'
  : `${import.meta.env.BASE_URL}storybook/`

type TopicLink = {
  label: string
  to: string
}

type TopicCard = {
  id: string
  title: string
  description: string
  status: 'In progress'
  links: TopicLink[]
  personas: string[]
  attribution: string
}

const TOPICS: TopicCard[] = [
  {
    id: 'catalog-experience',
    title: 'Catalog experience',
    description: 'Browse and manage catalog offerings across personas.',
    status: 'In progress',
    links: [
      { label: 'Provider Admin', to: '/provider/workspace?nav=catalog' },
      { label: 'Tenant Admin', to: '/tenant-admin/northsummit/workspace?nav=catalog' },
      { label: 'Tenant User', to: '/tenant-user/northsummit/workspace?nav=catalog' },
      { label: 'IdP Manager', to: '/idp-manager/bluesolace' },
    ],
    personas: [],
    attribution: `Fix version 0.4 · ${formatUpdatedDate(BMAAS_LANDING_LAST_UPDATED)}`,
  },
]

function formatUpdatedDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return isoDate
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function topicMatchesQuery(topic: TopicCard, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  const haystack = [topic.title, topic.description, topic.status, ...topic.links.map((l) => l.label), ...topic.personas]
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalized)
}

function TopicCardView({ topic }: { topic: TopicCard }) {
  return (
    <Card
      id={`topic-${topic.id}`}
      component="article"
      className="bmaas-landing-topic-card"
      aria-labelledby={topic.id}
    >
      <CardTitle>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
          <Flex
            className="bmaas-landing-topic-card__meta"
            alignItems={{ default: 'alignItemsCenter' }}
            justifyContent={{ default: 'justifyContentSpaceBetween' }}
            gap={{ default: 'gapSm' }}
          >
            <Flex alignItems={{ default: 'alignItemsCenter' }} flexWrap={{ default: 'wrap' }} gap={{ default: 'gapSm' }}>
              <Label variant="outline">{topic.status}</Label>
            </Flex>
          </Flex>
          <Title id={topic.id} headingLevel="h3" size="lg" className="bmaas-landing-topic-card__title">
            {topic.title}
          </Title>
        </Flex>
      </CardTitle>
      <CardBody className="bmaas-landing-topic-card__body">
        <Content component="p" className="bmaas-landing-topic-card__description">
          {topic.description}
        </Content>
        <ul className="bmaas-landing-topic-card__links">
          {topic.links.map((link) => (
            <li key={`${topic.id}-${link.label}`}>
              <RouterButton
                variant="link"
                isInline
                icon={<BlueprintIcon />}
                to={link.to}
                aria-label={`${topic.title}: ${link.label}`}
              >
                {link.label}
              </RouterButton>
            </li>
          ))}
        </ul>
        <p className="bmaas-landing-topic-card__attribution">{topic.attribution}</p>
        {topic.personas.length > 0 ? (
          <LabelGroup className="bmaas-landing-topic-card__personas" numLabels={topic.personas.length}>
            {topic.personas.map((persona) => (
              <Label key={persona} variant="outline">
                {persona}
              </Label>
            ))}
          </LabelGroup>
        ) : null}
      </CardBody>
    </Card>
  )
}

function TopicListRow({ topic }: { topic: TopicCard }) {
  return (
    <Flex
      component="article"
      direction={{ default: 'column' }}
      gap={{ default: 'gapMd' }}
      className="bmaas-landing-topic-list-row"
      aria-labelledby={topic.id}
    >
      <Flex
        alignItems={{ default: 'alignItemsCenter' }}
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        gap={{ default: 'gapMd' }}
        flexWrap={{ default: 'wrap' }}
      >
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }} flex={{ default: 'flex_1' }}>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} flexWrap={{ default: 'wrap' }}>
            <Label variant="outline">{topic.status}</Label>
            <Title id={topic.id} headingLevel="h3" size="lg">
              {topic.title}
            </Title>
          </Flex>
          <Content component="p" className="bmaas-landing-topic-card__description">
            {topic.description}
          </Content>
        </Flex>
        {topic.personas.length > 0 ? (
          <LabelGroup numLabels={topic.personas.length}>
            {topic.personas.map((persona) => (
              <Label key={persona} variant="outline">
                {persona}
              </Label>
            ))}
          </LabelGroup>
        ) : null}
      </Flex>
      <ul className="bmaas-landing-topic-card__links">
        {topic.links.map((link) => (
          <li key={`${topic.id}-${link.label}`}>
            <RouterButton
              variant="link"
              isInline
              icon={<BlueprintIcon />}
              to={link.to}
              aria-label={`${topic.title}: ${link.label}`}
            >
              {link.label}
            </RouterButton>
          </li>
        ))}
      </ul>
      <p className="bmaas-landing-topic-card__attribution">{topic.attribution}</p>
    </Flex>
  )
}

export function BmaasLandingPage() {
  const [searchValue, setSearchValue] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const filteredTopics = TOPICS.filter((topic) => topicMatchesQuery(topic, searchValue))
  const inProgressTopics = filteredTopics.filter((topic) => topic.status === 'In progress')

  return (
    <Bullseye className="bmaas-role-landing">
      <Flex
        className="bmaas-role-landing__wrap"
        direction={{ default: 'column' }}
        alignItems={{ default: 'alignItemsCenter' }}
        gap={{ default: 'gapLg' }}
        flexWrap={{ default: 'nowrap' }}
      >
        <FlexItem>
          <Flex
            component="header"
            direction={{ default: 'column' }}
            alignItems={{ default: 'alignItemsCenter' }}
            gap={{ default: 'gapMd' }}
            className={css(alignmentStyles.textAlignCenter)}
          >
            <Brand src={redHatHatLogoUrl} alt="Red Hat" heights={{ default: '40px' }} />
            <Title headingLevel="h1" size="4xl">
              Red Hat Cloud Extensions Prototypes 0.4
            </Title>
            <Content component="p">Explore prototype experiences by topic.</Content>
          </Flex>
        </FlexItem>

        <FlexItem alignSelf={{ default: 'alignSelfStretch' }} className="bmaas-landing-main">
          <div className="catalog-view-toolbar bmaas-landing-toolbar">
            <div className="catalog-view-toolbar__start">
              <SearchInput
                className="catalog-search bmaas-landing-search"
                placeholder="Search topics, personas, Jira…"
                value={searchValue}
                onChange={(_event, value) => setSearchValue(value)}
                onClear={() => setSearchValue('')}
                aria-label="Search design topics"
              />
            </div>
            <ViewModeToggle
              viewMode={viewMode}
              onChange={setViewMode}
              idPrefix="landing-view"
              ariaLabel="Topic view"
            />
          </div>

          {filteredTopics.length === 0 ? (
            <CatalogFilterEmptyState
              title="No topics match your search"
              description="Try a different search term."
              onClearFilters={() => setSearchValue('')}
            />
          ) : (
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapXl' }}>
              {inProgressTopics.length > 0 ? (
                <Flex
                  component="section"
                  direction={{ default: 'column' }}
                  gap={{ default: 'gapLg' }}
                  aria-labelledby="bmaas-landing-in-progress-title"
                >
                  <Flex
                    className="bmaas-landing-section-heading"
                    alignItems={{ default: 'alignItemsCenter' }}
                    gap={{ default: 'gapSm' }}
                  >
                    <Title id="bmaas-landing-in-progress-title" headingLevel="h2" size="xl">
                      In progress
                    </Title>
                    <span
                      className="bmaas-landing-section-count"
                      aria-label={`${inProgressTopics.length} topics`}
                    >
                      {inProgressTopics.length}
                    </span>
                  </Flex>

                  {viewMode === 'list' ? (
                    <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
                      {inProgressTopics.map((topic) => (
                        <TopicListRow key={topic.id} topic={topic} />
                      ))}
                    </Flex>
                  ) : (
                    <div className="bmaas-landing-topic-grid">
                      {inProgressTopics.map((topic) => (
                        <TopicCardView key={topic.id} topic={topic} />
                      ))}
                    </div>
                  )}
                </Flex>
              ) : null}
            </Flex>
          )}
        </FlexItem>

        <FlexItem alignSelf={{ default: 'alignSelfStretch' }} className="bmaas-landing-resources">
          <Flex
            component="section"
            direction={{ default: 'column' }}
            gap={{ default: 'gapLg' }}
            fullWidth={{ default: 'fullWidth' }}
            aria-labelledby="bmaas-landing-resources-title"
          >
            <Title id="bmaas-landing-resources-title" headingLevel="h2" size="xl">
              Resources
            </Title>
            <List className="bmaas-landing-resources__list">
              <ListItem>
                <Button
                  variant="link"
                  component="a"
                  isInline
                  href="https://docs.google.com/spreadsheets/d/1Gw4zbnim9oCjHkvqREvoNyViHgLd4JBZcBmtaFrO0xE/edit?gid=1297446303#gid=1297446303"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Delivery Overview
                </Button>
              </ListItem>
              <ListItem>
                <Button
                  variant="link"
                  component="a"
                  isInline
                  href={`${import.meta.env.BASE_URL}vmaas-ux-prototype.html`}
                >
                  Virtual Machine Experience
                </Button>
              </ListItem>
              <ListItem>
                <Button
                  variant="link"
                  component="a"
                  isInline
                  href={STORYBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Golden Patterns (Storybook)
                </Button>
              </ListItem>
            </List>
            <Content component="p">Last updated: {BMAAS_LANDING_LAST_UPDATED}</Content>
          </Flex>
        </FlexItem>
      </Flex>
    </Bullseye>
  )
}
