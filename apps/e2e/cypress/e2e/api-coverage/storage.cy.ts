/**
 * API Coverage — storage domain
 * Routes: block_volumes, volume_snapshots, object_storage_buckets,
 *         bucket_access_keys, storage_tiers, storage_backends
 */

describe('[storage]', () => {
  beforeEach(() => cy.realLogin());

  it('GET v1/block_volumes — returns items', () => {
    cy.trackApi('storage', 'v1/block_volumes', { visitUrl: '/storage/volumes' });
    cy.checkField('storage', 'BlockVolumesPage', 'Volume rows', '.pf-v5-c-table tbody tr, [data-testid="volume-row"]');
  });

  it('GET v1/volume_snapshots — returns items', () => {
    cy.trackApi('storage', 'v1/volume_snapshots', { visitUrl: '/storage/snapshots' });
    cy.checkField('storage', 'SnapshotsPage', 'Snapshot rows', '.pf-v5-c-table tbody tr, [data-testid="snapshot-row"]');
  });

  it('GET v1/object_storage_buckets — returns items', () => {
    cy.trackApi('storage', 'v1/object_storage_buckets', { visitUrl: '/bucket-storage' });
    cy.checkField('storage', 'ObjectStoragePage', 'Bucket rows', '.pf-v5-c-table tbody tr, [data-testid="bucket-row"]');
  });

  it('GET v1/bucket_access_keys — endpoint reachable', () => {
    cy.trackApi('storage', 'v1/bucket_access_keys', { visitUrl: '/bucket-storage' });
  });

  it('GET v1/storage_tiers — returns items (tenant)', () => {
    cy.trackApi('storage', 'v1/storage_tiers', { visitUrl: '/storage/tiers' });
    cy.checkField('storage', 'StorageTiersPage', 'Storage tier rows', '.pf-v5-c-table tbody tr, [data-testid="tier-row"]');
  });

  it('GET v1/storage_backends — returns items (provider)', function () {
    if (!Cypress.env('keycloak_provider_user')) return this.skip();
    cy.realLogin(Cypress.env('keycloak_provider_user'), Cypress.env('keycloak_provider_pass'));
    cy.trackApi('storage', 'v1/storage_backends', { visitUrl: '/provider/storage-backends' });
    cy.checkField('storage', 'ProviderStorageBackendsPage', 'Storage backend rows', '.pf-v5-c-table tbody tr, [data-testid="backend-row"]');
  });
});
