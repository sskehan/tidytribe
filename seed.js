// Tidy Tribe — starting data loaded the first time an adult taps "Set up Tidy Tribe".
// Everything here can be changed later inside the app (Admin > Manage).
const ALL = [0, 1, 2, 3, 4, 5, 6];
const SCHOOL = [1, 2, 3, 4, 5];

export const SEED_CONFIG = {
  version: 1,
  appName: 'Tidy Tribe',
  pointsPerDollar: 100,          // 1,000 points = $10
  cashOutLot: 1000,              // cash outs in $10 lots
  houses: {
    dad: { name: "Dad's house", admins: ['shaun', 'lyndsey'] },
    heidi: { name: "Heidi's house", admins: ['heidi'] }
  },
  adults: {
    shaun: { name: 'Shaun' },
    lyndsey: { name: 'Lyndsey' },
    heidi: { name: 'Heidi' }
  },
  kids: {
    alex: { name: 'Alex', custody: 'shared', house: 'dad', colour: '#1D4ED8', simple: false },
    emma: { name: 'Emma', custody: 'shared', house: 'dad', colour: '#C2410C', simple: false },
    brooke: { name: 'Brooke', custody: 'fixed', house: 'dad', colour: '#7C3AED', simple: true }
  },
  custody: { anchor: '2026-10-25T17:00', firstHouse: 'dad', secondHouse: 'heidi' },
  overrides: [],
  terms: [
    { start: '2026-02-02', end: '2026-04-02' },
    { start: '2026-04-22', end: '2026-07-03' },
    { start: '2026-07-21', end: '2026-09-25' },
    { start: '2026-10-13', end: '2026-12-17' },
    { start: '2027-02-03', end: '2027-04-09' },
    { start: '2027-04-29', end: '2027-07-02' },
    { start: '2027-07-20', end: '2027-09-24' },
    { start: '2027-10-11', end: '2027-12-17' }
  ],
  publicHolidays: [
    '2026-01-01', '2026-01-26', '2026-04-03', '2026-04-04', '2026-04-05', '2026-04-06', '2026-04-25',
    '2026-06-08', '2026-10-05', '2026-12-25', '2026-12-26', '2026-12-28',
    '2027-01-01', '2027-01-26', '2027-03-26', '2027-03-27', '2027-03-28', '2027-03-29', '2027-04-25',
    '2027-06-14', '2027-10-04', '2027-12-25', '2027-12-26', '2027-12-27', '2027-12-28'
  ],
  pupilFreeDays: [],
  abPresets: ['Offering to help', 'Helped without being asked', 'Helping a brother or sister', 'Being kind to someone', 'Extra effort at school'],
  magic: { pts: 10, from: '20:00', to: '22:00', streakDays: 30, kids: ['alex', 'emma'] },
  owner: 'shaun',
  penalty: { on: true, pct: 50, pts: 50, floor: true, kids: ['alex', 'emma'] },
  pins: {}
};

function c(id, name, group, due, pts, kids, house, extra) {
  return Object.assign({ id, name, group, due, pts, kids, house, days: ALL, rotate: false, rotateOffset: 0, schoolOnly: false, active: true }, extra || {});
}

export const SEED_CHORES = [
  // Shared by more than one kid (each kid does their own)
  c('teeth-am', 'Brush teeth', 'morning', '08:30', 2, ['alex', 'emma', 'brooke'], 'dad'),
  c('bed', 'Make bed & tidy room', 'morning', '08:30', 5, ['alex', 'emma', 'brooke'], 'dad'),
  c('breakfast', 'Prepare & eat breakfast', 'morning', '08:30', 2, ['alex', 'emma', 'brooke'], 'dad'),
  c('teeth-pm', 'Brush teeth', 'evening', '20:45', 2, ['alex', 'emma', 'brooke'], 'dad'),
  c('lunch', 'Pack lunch', 'morning', '08:30', 2, ['alex', 'emma'], 'dad'),
  c('homework', 'Homework, read', 'afterschool', '17:00', 10, ['alex', 'emma'], 'dad', { days: SCHOOL, schoolOnly: true }),
  c('schoolbag', 'Remove lunch bag & rubbish from school bag', 'afterschool', '17:00', 2, ['alex', 'emma'], 'dad', { days: SCHOOL, schoolOnly: true }),
  c('uniform', 'Prepare school uniform & bag for next day', 'afterschool', '21:00', 2, ['alex', 'emma'], 'dad', { schoolNext: true }),
  // Alex and Emma take turns: stays with one until they do it, then passes to the other (bins and dishwasher)
  c('ae-rubbish', 'Take out rubbish', 'household', '21:00', 5, ['alex', 'emma'], 'dad', { rotate: 'turns' }),
  c('recycling', 'Take out recyclables', 'household', '21:00', 5, ['alex', 'emma'], 'dad', { rotate: 'turns' }),
  c('dishwasher', 'Unstack dishwasher', 'household', '21:00', 5, ['alex', 'emma'], 'dad', { rotate: 'turns' }),
  // Alex
  c('chooks', 'Feed chooks', 'morning', '08:30', 5, ['alex'], 'dad'),
  c('alex-meds', 'Ritalin', 'morning', '08:45', 14, ['alex'], 'dad'),
  c('tables', 'Wipe down & clear tables/chairs after dinner', 'evening', '21:00', 5, ['alex'], 'dad'),
  // Emma
  c('emma-meds', 'Meds', 'evening', '20:00', 10, ['emma'], 'dad'),
  c('table-set', 'Set the dinner table', 'evening', '19:00', 5, ['emma'], 'dad'),
  c('emma-dishes', 'Dry dishes', 'evening', '21:30', 5, ['emma'], 'dad'),
  // Brooke
  c('clothes', 'Change clothes', 'morning', '08:00', 2, ['brooke'], 'dad'),
  c('washup', 'Wash-up / shower', 'morning', '08:00', 2, ['brooke'], 'dad'),
  c('gummies', 'Gummies', 'morning', '08:00', 5, ['brooke'], 'dad'),
  c('reading', 'Read a book or do Reading Eggs', 'morning', '09:30', 2, ['brooke'], 'dad'),
  c('brooke-dry', 'Dry dishes', 'evening', '19:00', 10, ['brooke'], 'dad'),
  c('brooke-unstack', 'Unstack dishes', 'evening', '19:30', 10, ['brooke'], 'dad'),
  c('toys', 'Pack away toys', 'evening', '20:00', 5, ['brooke'], 'dad'),
  c('bath', 'Shower / bath', 'evening', '20:00', 2, ['brooke'], 'dad'),
  c('brooke-rubbish', 'Take out rubbish', 'household', '21:00', 5, ['brooke'], 'dad')
];

// Whose turn it is first for the 'turns' chores (change any time under Admin > Chores)
export const SEED_TURNS = { 'ae-rubbish': 'alex', recycling: 'emma', dishwasher: 'emma' };

export const SEED_REWARDS = [
  { id: 'icecream', name: 'Ice cream', pts: 175, icon: 'icecream', active: true },
  { id: 'screentime', name: 'Extra screen time', pts: 500, icon: 'screen', active: true }
];

export const SEED_BALANCES = {
  alex: { points: 45, lastOp: 'opening', stars: {} },
  emma: { points: 721, lastOp: 'opening', stars: {} },
  brooke: { points: 842, lastOp: 'opening', stars: {} }
};
