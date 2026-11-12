export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    subscriptionsCount: 1,
    remindersCount: 1,
    settings: {
      enabled: true,
      preferredTimeOfDay: '09:00',
      advanceNotice: 'on-time',
      snoozeDefault: '1-day',
      timezone: 'UTC'
    }
  });
}
