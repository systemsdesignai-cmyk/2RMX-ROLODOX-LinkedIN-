export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    publicKey: process.env.VAPID_PUBLIC_KEY || 'BKs5orIKiAe5KD8t3TianF0FuDMSSmkvNB7xDfMckeZfCx3gmCXJEn66MxstLXcll1NWy0-vHJGylmVg6FeBfRU'
  });
}
