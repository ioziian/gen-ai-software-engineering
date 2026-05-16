import { Request, Response, NextFunction } from 'express';

export const validateTicket = (req: Request, res: Response, next: NextFunction) => {
  const { customer_email, subject, description } = req.body;
  if (!customer_email || !customer_email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!subject || subject.length === 0 || subject.length > 200) {
    return res.status(400).json({ error: 'Invalid subject' });
  }
  if (!description || description.length < 10 || description.length > 2000) {
    return res.status(400).json({ error: 'Invalid description' });
  }
  next();
};
