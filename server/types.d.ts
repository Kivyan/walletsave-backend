declare module 'email-existence' {
  export function check(email: string, callback: (error: Error | null, result: boolean) => void): void;
}