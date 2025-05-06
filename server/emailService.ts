import nodemailer from 'nodemailer';
import { User } from '@shared/schema';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import dns from 'dns';
import { promisify } from 'util';
import * as emailValidator from 'email-validator';
import EmailValidator from 'email-deep-validator';

type EmailConfig = {
  service?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized?: boolean;
  };
};

// Criação do transporte para envio de emails
let transporter: nodemailer.Transporter;

// Função que inicializa o transporter do Nodemailer
export async function initializeEmailService() {
  // Para debugging, podemos forçar reinicialização do transporter
  // descomentando a linha abaixo
  // transporter = undefined;
  
  if (transporter) {
    return transporter;
  }

  // Verifica se as credenciais estão disponíveis no ambiente
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    throw new Error('Credenciais de email não configuradas. Defina EMAIL_USER e EMAIL_PASSWORD.');
  }

  // Determina o serviço com base no domínio do email
  const emailDomain = emailUser.split('@')[1]?.toLowerCase() || '';
  
  // Para testes, podemos forçar um provedor específico, independente do domínio do email
  // Descomentar a linha abaixo e substituir pelo provedor desejado:
  // const forceProvider = 'outlook'; // 'gmail', 'outlook', 'yahoo', etc.
  // const providerToUse = forceProvider || emailDomain;
  
  // Configurações para diferentes provedores de email
  let mailConfig: EmailConfig;

  if (emailDomain.includes('gmail.com')) {
    // Configuração para Gmail
    // Para o Gmail, é necessário usar uma "Senha de App" ou configurar OAuth2
    // https://nodemailer.com/usage/using-gmail/
    mailConfig = {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use TLS
      auth: {
        user: emailUser,
        pass: emailPassword
      },
      // Desative a validação de certificado para debug
      tls: {
        rejectUnauthorized: false
      }
    };
    console.log('Configurando serviço de email com Gmail (porta 465/SSL)');
  } else if (emailDomain.includes('outlook.com') || emailDomain.includes('hotmail.com')) {
    // Configuração para Outlook/Hotmail
    mailConfig = {
      service: 'outlook',
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    };
    console.log('Configurando serviço de email com Outlook/Hotmail');
  } else if (emailDomain.includes('yahoo.com')) {
    // Configuração para Yahoo
    mailConfig = {
      service: 'yahoo',
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    };
    console.log('Configurando serviço de email com Yahoo');
  } else {
    // Configuração genérica para outros provedores
    mailConfig = {
      host: 'smtp.' + emailDomain,
      port: 587,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    };
    console.log(`Configurando serviço de email com provedor genérico (${emailDomain})`);
  }

  // Cria um transporter SMTP com as configurações determinadas
  transporter = nodemailer.createTransport(mailConfig as SMTPTransport.Options);

  // Verifica a conexão
  try {
    await transporter.verify();
    console.log('Conexão com o servidor de email estabelecida com sucesso!');
    console.log(`Serviço de email inicializado com a conta: ${emailUser}`);
    return transporter;
  } catch (error) {
    console.error('Erro na conexão com o servidor de email:', error);
    
    // Mensagem específica para erro de autenticação do Gmail
    if (emailDomain.includes('gmail.com') && error instanceof Error && error.message.includes('Username and Password not accepted')) {
      console.error(`\nERRO DE AUTENTICAÇÃO DO GMAIL: ${error.message}\n`);
      console.error(`IMPORTANTE: Para usar o Gmail, você precisa:\n1. Ativar a verificação em duas etapas na sua conta Google\n2. Criar uma "Senha de App" específica para este aplicativo em: https://myaccount.google.com/apppasswords\n`);
    }
    
    throw new Error(`Não foi possível conectar ao servidor de email: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Função para enviar email de verificação
export async function sendVerificationEmail(
  email: string,
  verificationCode: string,
  userName: string
) {
  try {
    await initializeEmailService();

    // Configuração do email
    const emailUser = process.env.EMAIL_USER || (transporter as any)?.options?.auth?.user || 'noreply@walletsave.com';
    const fromName = "Wallet Save";
    
    const mailOptions = {
      from: `"${fromName}" <${emailUser}>`,
      to: email,
      subject: 'Verifique seu email - Wallet Save',
      text: `Olá ${userName},\n\nSeu código de verificação é: ${verificationCode}\n\nInsira este código no aplicativo para confirmar seu email.\n\nObrigado,\nEquipe Wallet Save`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4a5568;">Confirmação de Email</h2>
          <p>Olá <strong>${userName}</strong>,</p>
          <p>Obrigado por se cadastrar no Wallet Save! Para completar seu registro, por favor insira o código abaixo no aplicativo:</p>
          <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #4a5568; margin: 0;">${verificationCode}</h1>
          </div>
          <p>Se você não solicitou esta verificação, por favor ignore este email.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #718096; font-size: 13px;">
            <p>Wallet Save - Organize suas finanças de forma simples e eficiente</p>
          </div>
        </div>
      `,
    };

    // Envio do email
    const info = await transporter.sendMail(mailOptions);

    console.log(`Email de verificação enviado para: ${email}`);
    console.log(`ID da mensagem: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Função para verificar se um endereço de email existe (mailbox verification)
// Utilizamos uma biblioteca especializada que verifica formato, domínio MX e SMTP
async function checkEmailExists(email: string): Promise<boolean> {
  try {
    console.log(`Iniciando verificação completa do email: ${email}`);
    
    // Criar instância do validador profundo de email
    const emailDeepValidator = new EmailValidator();
    
    // Verificação completa incluindo formato, domínio e caixa postal
    console.log(`Realizando verificação completa para: ${email}`);
    const { wellFormed, validDomain, validMailbox } = await emailDeepValidator.verify(email);
    
    // Registrando resultado de cada etapa da verificação
    console.log(`Verificação do email ${email}:
      Formato válido: ${wellFormed ? 'Sim' : 'Não'}
      Domínio válido (MX): ${validDomain ? 'Sim' : 'Não'}
      Caixa postal existe: ${validMailbox !== null ? (validMailbox ? 'Sim' : 'Não') : 'Inconclusivo'}`);
    
    // IMPORTANTE: validMailbox pode ser null se a verificação da caixa postal for inconclusiva
    // ou boolean indicando se a caixa existe (true) ou não (false)
    
    // Verificar formato e domínio primeiro (obrigatório)
    if (!wellFormed || !validDomain) {
      console.log(`Email inválido (formato ou domínio): ${email}`);
      return false;
    }
    
    // Agora verificamos a existência da caixa postal
    // Se a verificação for inconclusiva (validMailbox === null), vamos realizar verificações adicionais
    if (validMailbox === false) {
      console.log(`Caixa postal confirmada como inexistente: ${email}`);
      return false;
    }
    
    // Se a verificação da caixa for inconclusiva, fazemos outras verificações
    if (validMailbox === null) {
      console.log(`Verificação da caixa postal inconclusiva para: ${email}`);
      
      // Extrair domínio e nome de usuário do email
      const [username, domain] = email.toLowerCase().split('@');
      
      // Verificar nome de usuário muito curto
      if (username.length < 3) {
        console.log(`Nome de usuário muito curto: ${username}`);
        return false;
      }
      
      // Verificar nomes de usuário obviamente genéricos ou de teste
      const invalidUsernames = ['test', 'teste', 'admin', 'user', 'example', 'exemplo', 'demo', 'fake'];
      if (invalidUsernames.includes(username.toLowerCase())) {
        console.log(`Nome de usuário genérico/de teste: ${username}`);
        return false;
      }
      
      // Para domínios conhecidos como Gmail, Hotmail, etc. somos mais cautelosos
      const strictDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
      if (strictDomains.includes(domain)) {
        console.log(`Domínio conhecido (${domain}) mas verificação de caixa inconclusiva, precisa enviar email para confirmar: ${email}`);
        // Para esses domínios, permitimos condicional à verificação por email
        return true;
      }
      
      // Para outros domínios menos conhecidos, permitimos o registro
      console.log(`Domínio menos conhecido (${domain}), permitindo registro com verificação por email: ${email}`);
      return true;
    }
    
    // Se chegou aqui, a caixa postal foi confirmada como existente
    console.log(`Email completamente validado e confirmado: ${email}`);
    return true;
  } catch (error) {
    // Em caso de erro durante a verificação
    console.error(`Erro ao verificar email ${email}: ${error instanceof Error ? error.message : String(error)}`);
    
    // Verificar se o erro contém indicações de que o email não existe
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes('mailbox not found') || 
        errorMessage.includes('user not found') || 
        errorMessage.includes('does not exist') ||
        errorMessage.includes('recipient rejected')
      ) {
        console.log(`Erro indica que o email não existe: ${email}`);
        return false;
      }
    }
    
    // Para outros erros técnicos, permitimos o registro com verificação por email
    console.log(`Erro técnico na verificação do email, permitindo com verificação por email: ${email}`);
    return true;
  }
}

// Verificar se um domínio de email é válido e existe
export async function verifyEmailDomain(email: string): Promise<{
  isValid: boolean;
  reason?: string;
  mailboxExists?: boolean;
}> {
  try {
    // Validar formato básico do email usando a biblioteca
    if (!emailValidator.validate(email)) {
      console.log(`Formato de email inválido: ${email}`);
      return { isValid: false, reason: 'Formato de email inválido', mailboxExists: false };
    }
    
    // Normalizar o email para minúsculas
    const normalizedEmail = email.toLowerCase();
    
    // Extrair o username e domínio do email
    const [username, domain] = normalizedEmail.split('@');
    console.log(`Verificando domínio de email: ${domain}`);
    
    if (!domain) {
      console.log('Formato de email inválido: domínio ausente');
      return { isValid: false, reason: 'Formato de email inválido', mailboxExists: false };
    }

    // Validar o formato do username
    if (username.length < 3) {
      console.log(`Username muito curto: ${username}`);
      return { isValid: false, reason: 'Endereço de email inválido: nome de usuário muito curto', mailboxExists: false };
    }
    
    // Verificar padrões comuns de emails temporários/falsos
    // Mas ignoramos se o email contém números, pois muitos emails legítimos têm números no nome
    let containsNumbers = /\d+/.test(username);
    if (!containsNumbers && /^(test|teste|fake|temp|dummy|asdsrer|example|exemplo)$/.test(username)) {
      console.log(`Username detectado como padrão de teste: ${username}`);
      return { isValid: false, reason: 'Este formato de email não é aceito para registros', mailboxExists: false };
    }

    // Lista de domínios falsos ou temporários - lista ampliada
    const fakeDomains = [
      'exemplo.com', 'teste.com', 'fake.com', 'invalido.com', 'emailfalso.com', 'nonexistent.com', 
      'naoeexiste.com', 'asdsrer.com', 'temp.com', 'tempmail.com', 'disposable.com', 'mailinator.com',
      'yopmail.com', 'trashmail.com', 'guerrillamail.com', 'example.com', 'test.com', 'sample.com',
      'fakeinbox.com', 'tempmail.net', 'maildrop.cc', 'dispostable.com', 'sharklasers.com',
      'mailnator.com', 'mailnesia.com', 'spam4.me', '10minutemail.com', 'tempinbox.com'
    ];
    
    if (fakeDomains.includes(domain)) {
      console.log(`Domínio detectado como falso/temporário: ${domain}`);
      return { isValid: false, reason: 'Este domínio de email não é permitido para registro', mailboxExists: false };
    }

    // Verificar combinações específicas de usuário+domínio que são sabidamente inválidas
    // Apenas padrões genéricos óbvios, não emails específicos de usuários reais
    const invalidCombinations = [
      'test@hotmail.com',
      'teste@gmail.com',
      'example@gmail.com',
      'exemplo@outlook.com',
      'fake@yahoo.com',
      'admin@example.com',
      'user@example.com',
      'info@example.com'
    ];
    
    // Padrões óbvios de teste/fake que não são emails reais
    const invalidPatterns = [
      /^test\d*@/i,        // test@, test1@, test123@, etc
      /^admin@/i,          // admin@
      /^example@/i,        // example@
      /^user\d*@/i,        // user@, user1@, user123@, etc
      /^demo@/i,           // demo@
      /^fake@/i,           // fake@
      /^sample@/i,         // sample@
      /^noreply@/i,        // noreply@
      /^dummy@/i           // dummy@
    ];
    
    // Verificação de combinação exata
    if (invalidCombinations.includes(normalizedEmail)) {
      console.log(`Email detectado como padrão inválido/genérico: ${normalizedEmail}`);
      return { isValid: false, reason: 'Este email parece ser um endereço genérico ou de teste', mailboxExists: false };
    }
    
    // Verificação de padrões - já estamos usando a variável containsNumbers definida acima
    if (!containsNumbers) {
      for (const pattern of invalidPatterns) {
        if (pattern.test(normalizedEmail)) {
          console.log(`Email detectado com padrão suspeito: ${normalizedEmail}`);
          return { isValid: false, reason: 'Este email segue um padrão típico de endereços genéricos', mailboxExists: false };
        }
      }
    }

    // Verificar registros MX do domínio
    const resolveMx = promisify(dns.resolveMx);
    
    try {
      console.log(`Consultando registros MX para ${domain}...`);
      const records = await resolveMx(domain);
      console.log(`Registros MX para ${domain}:`, records);
      
      if (!records || records.length === 0) {
        console.log(`Nenhum registro MX encontrado para ${domain}`);
        return { isValid: false, reason: 'Este domínio de email não possui servidores de email válidos', mailboxExists: false };
      }
      
      // Verificando se a caixa de email (mailbox) existe realmente
      try {
        // Esta verificação pode ser demorada e não é 100% confiável, mas é uma camada extra de segurança
        console.log(`Verificando se a caixa de email existe: ${email}`);
        const mailboxExists = await checkEmailExists(email);
        
        if (!mailboxExists) {
          console.log(`A caixa de email não existe: ${email}`);
          return { isValid: false, reason: 'Este endereço de email não existe ou não pode receber mensagens', mailboxExists: false };
        }
        
        console.log(`A caixa de email existe e pode receber mensagens: ${email}`);
        return { isValid: true, mailboxExists: true };
      } catch (mailboxError) {
        console.error(`Erro ao verificar existência da caixa de email: ${mailboxError instanceof Error ? mailboxError.message : String(mailboxError)}`);
        // Se a verificação da caixa falhar por algum motivo técnico, permitimos continuar pois o domínio é válido
        return { isValid: true, reason: 'Domínio válido, mas não foi possível verificar a caixa de email', mailboxExists: undefined };
      }
    } catch (error) {
      console.error(`Erro ao verificar registros MX para ${domain}:`, error);
      // Se não conseguir resolver o MX, provavelmente o domínio não existe
      return { isValid: false, reason: `Domínio de email inválido ou inexistente: ${domain}`, mailboxExists: false };
    }
  } catch (error) {
    console.error('Erro ao verificar domínio de email:', error);
    return { isValid: false, reason: 'Erro ao verificar domínio de email', mailboxExists: false };
  }
}

// Função para reenviar o código de verificação
export async function resendVerificationCode(
  email: string,
  verificationCode: string,
  userName: string
) {
  return sendVerificationEmail(email, verificationCode, userName);
}
