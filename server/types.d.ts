// Tipo para a função check do email-existence
declare module 'email-existence' {
  export function check(email: string, callback: (error: Error | null, result: boolean) => void): void;
}

// Tipo para email-deep-validator
declare module 'email-deep-validator' {
  export default class EmailValidator {
    constructor(options?: { validateMx?: boolean; validateTypo?: boolean; validateSMTP?: boolean });
    verify(email: string): Promise<{
      wellFormed: boolean;   // Se o email tem formato correto
      validDomain: boolean;  // Se o domínio existe e tem registros MX
      validMailbox: boolean | null; // Se a caixa postal existe (true) ou não (false) ou inconclusivo (null)
    }>;
  }
}