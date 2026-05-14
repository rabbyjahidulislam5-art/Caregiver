declare namespace Express {
  interface Request {
    user?: { id: string; role: string };
    params: Record<string, string>;
  }
}
