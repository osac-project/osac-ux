export interface ProjectInstanceMock {
  name: string;
  href: string;
  type: string;
  created: string;
  status: 'Running';
  kind: 'Bare Metal' | 'Cluster';
}

export interface ProjectUserMock {
  name: string;
  email: string;
  role: 'Manager';
}

// Instance and user profile details are not available from the project APIs yet.
export const projectInstancesMock: ProjectInstanceMock[] = [
  {
    name: 'bm-server-06',
    href: '/bare-metal/bm-server-06',
    type: 'Bare Metal',
    created: 'Oct 27, 5:49 AM',
    status: 'Running',
    kind: 'Bare Metal',
  },
  {
    name: 'ocp-cluster-04',
    href: '/clusters/ocp-cluster-04',
    type: 'Cluster',
    created: 'Oct 27, 9:49 AM',
    status: 'Running',
    kind: 'Cluster',
  },
];

export const projectUsersMock: ProjectUserMock[] = [
  { name: 'Alex Johnson', email: 'alex.johnson@northsummitbank.com', role: 'Manager' },
  { name: 'Casey Morgan', email: 'casey.morgan@northsummitbank.com', role: 'Manager' },
  { name: 'Chris Morgan', email: 'cmorgan@northsummitbank.com', role: 'Manager' },
  { name: 'Jordan Lee', email: 'jordan.lee@northsummitbank.com', role: 'Manager' },
  { name: 'Sam Rivera', email: 'sam.rivera@northsummitbank.com', role: 'Manager' },
];
