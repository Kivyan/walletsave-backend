import nodemailer from 'nodemailer';
import { User } from '@shared/schema';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import dns from 'dns';
import { promisify } from 'util';

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

// Verificar se um domínio de email é válido e existe
export async function verifyEmailDomain(email: string): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  try {
    // Normalizar o email para minúsculas
    const normalizedEmail = email.toLowerCase();
    
    // Extrair o username e domínio do email
    const [username, domain] = normalizedEmail.split('@');
    console.log(`Verificando domínio de email: ${domain}`);
    
    if (!domain) {
      console.log('Formato de email inválido: domínio ausente');
      return { isValid: false, reason: 'Formato de email inválido' };
    }

    // Validar o formato do username
    if (username.length < 3) {
      console.log(`Username muito curto: ${username}`);
      return { isValid: false, reason: 'Endereço de email inválido: nome de usuário muito curto' };
    }
    
    // Verificar padrões comuns de emails temporários/falsos
    if (/^(test|teste|fake|temp|dummy|asdsrer|example|exemplo)/.test(username)) {
      console.log(`Username detectado como padrão de teste: ${username}`);
      return { isValid: false, reason: 'Este formato de email não é aceito para registros' };
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
      return { isValid: false, reason: 'Este domínio de email não é permitido para registro' };
    }

    // Verificar registros MX do domínio
    const resolveMx = promisify(dns.resolveMx);
    
    try {
      console.log(`Consultando registros MX para ${domain}...`);
      const records = await resolveMx(domain);
      console.log(`Registros MX para ${domain}:`, records);
      
      if (!records || records.length === 0) {
        console.log(`Nenhum registro MX encontrado para ${domain}`);
        return { isValid: false, reason: 'Este domínio de email não possui servidores de email válidos' };
      }
      
      // Verificar combinações específicas de usuário+domínio que são sabidamente inválidas
      // Lista de combinações conhecidas como inválidas
      const invalidCombinations = [
        'asdsrer@hotmail.com',
        'kivyan2011@hotmail.com',  // Adicione combinações específicas que você identificou como falsas
        'test@hotmail.com',
        'teste@gmail.com',
        'example@gmail.com',
        'exemplo@outlook.com',
        'fake@yahoo.com'
      ];
      
      if (invalidCombinations.includes(normalizedEmail)) {
        console.log(`Email detectado como inválido/teste: ${normalizedEmail}`);
        return { isValid: false, reason: 'Este endereço de email foi identificado como inválido' };
      }
      
      // Email válido com domínio existente
      console.log(`Domínio válido com ${records.length} servidores de email`);
      return { isValid: true };
    } catch (error) {
      console.error(`Erro ao verificar registros MX para ${domain}:`, error);
      // Se não conseguir resolver o MX, provavelmente o domínio não existe
      return { isValid: false, reason: `Domínio de email inválido ou inexistente: ${domain}` };
    }
  } catch (error) {
    console.error('Erro ao verificar domínio de email:', error);
    return { isValid: false, reason: 'Erro ao verificar domínio de email' };
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
