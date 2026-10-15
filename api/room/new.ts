import type { Request, Response } from 'express';

export default function handler(req: Request, res: Response) {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  res.status(200).json({ roomId: code });
}
