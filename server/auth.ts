import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, InsertCategory } from "@shared/schema";
import { DEFAULT_CATEGORIES } from "../client/src/lib/utils";
import { sendVerificationEmail, resendVerificationCode, verifyEmailDomain } from "./emailService";
import { log } from "./vite";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateVerificationCode() {
  // Gera um código de 6 dígitos para verificação
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateVerificationToken(email: string, code: string) {
  // Cria um token único combinando email, código e timestamp
  const timestamp = Date.now().toString();
  const data = `${email}-${code}-${timestamp}`;
  return createHash('sha256').update(data).digest('hex');
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "expense-tracker-session-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "lax"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        // Verificar se o usuário confirmou o email
        if (!user.isVerified) {
          return done(null, false, { message: 'Por favor, verifique seu email antes de fazer login' });
        }
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validar se o email tem formato correto
      const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
      if (!emailRegex.test(req.body.username)) {
        return res.status(400).json({ message: "Formato de email inválido" });
      }
      
      // Verificar se o domínio de email existe e é válido
      try {
        log(`Verificando se o email existe: ${req.body.username}`);
        const { isValid, reason } = await verifyEmailDomain(req.body.username);
        log(`Resultado da verificação de email: isValid = ${isValid}, reason = ${reason || "N/A"}`);
        
        if (!isValid) {
          log(`Email rejeitado: ${req.body.username} - Motivo: ${reason || "Email inválido ou inexistente"}`);
          return res.status(400).json({ message: reason || "Email inválido ou inexistente" });
        }
        log(`Email validado com sucesso: ${req.body.username}`);
      } catch (error) {
        log(`Erro ao verificar domínio de email: ${error instanceof Error ? error.message : String(error)}`);
        // Retornar erro em vez de prosseguir
        return res.status(400).json({ message: "Não foi possível validar o email. Tente novamente." });
      }

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Este email já está cadastrado" });
      }

      // Gerar código de verificação
      const verificationCode = generateVerificationCode();
      
      // Criar usuário com código de verificação
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        verificationCode,
        isVerified: false,
      });

      // Criar categorias padrão para o novo usuário
      const defaultCategoriesPromises = DEFAULT_CATEGORIES.map(category => {
        const newCategory: InsertCategory = {
          name: category.name,
          color: category.color,
          icon: category.icon,
          userId: user.id
        };
        return storage.createCategory(newCategory);
      });
      
      // Aguardar a criação de todas as categorias padrão
      await Promise.all(defaultCategoriesPromises);

      // Enviar email de verificação
      try {
        const emailResult = await sendVerificationEmail(
          user.username,
          verificationCode,
          user.fullName
        );
        
        if (emailResult.success) {
          log(`Email de verificação enviado com sucesso para ${user.username}`);
        } else {
          log(`Falha ao enviar email de verificação: ${emailResult.error}`);
        }
      } catch (error) {
        log(`Erro ao enviar email de verificação: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Ao invés de fazer login, primeiro exigimos a verificação
      // Não enviamos o código na resposta, pois ele será enviado por email
      res.status(201).json({
        message: "Conta criada com sucesso! Por favor, verifique seu email para obter o código de verificação.",
        userId: user.id,
        email: user.username
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    try {
      // Verificar se existe um usuário com o email fornecido
      const userCheck = await storage.getUserByUsername(req.body.username);
      
      // Se existe o usuário mas não está verificado
      if (userCheck && !userCheck.isVerified && await comparePasswords(req.body.password, userCheck.password)) {
        // Gerar novo código de verificação
        const verificationCode = generateVerificationCode();
        
        // Atualizar o código no banco de dados
        await storage.updateUser(userCheck.id, {
          verificationCode
        });
        
        // Enviar novo email com código de verificação
        try {
          const emailResult = await resendVerificationCode(
            userCheck.username,
            verificationCode,
            userCheck.fullName
          );
          
          if (emailResult.success) {
            log(`Código de verificação enviado automaticamente durante login para ${userCheck.username}`);
          } else {
            log(`Falha ao enviar código durante login: ${emailResult.error}`);
          }
        } catch (error) {
          log(`Erro ao enviar código durante login: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        // Retornar erro 403 (não autorizado) com informações para mostrar o modal de verificação
        return res.status(403).json({
          needsVerification: true,
          message: "Por favor, verifique seu email antes de fazer login",
          userId: userCheck.id,
          email: userCheck.username
        });
      }
      
      // Continuar com a autenticação normal se não for o caso de email não verificado
      passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string } | undefined) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({
            message: info?.message || "Email ou senha inválidos"
          });
        }
        req.login(user, (err: Error | null) => {
          if (err) return next(err);
          res.status(200).json(req.user);
        });
      })(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err: Error | null) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Return user without password
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });

  app.put("/api/user", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = (req.user as SelectUser).id;
    const { password, ...updateData } = req.body;
    
    // If password is being updated, hash it
    const processUpdate = async () => {
      if (password) {
        const hashedPassword = await hashPassword(password);
        return { ...updateData, password: hashedPassword };
      }
      return updateData;
    };
    
    processUpdate()
      .then(data => storage.updateUser(userId, data))
      .then(user => {
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      })
      .catch(next);
  });
  
  // Nova rota para verificar o email
  app.post("/api/verify-email", async (req, res, next) => {
    try {
      const { userId, code } = req.body;
      
      if (!userId || !code) {
        return res.status(400).json({
          message: "Código de verificação ou ID de usuário inválido"
        });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({
          message: "Usuário não encontrado"
        });
      }
      
      if (user.isVerified) {
        return res.status(400).json({
          message: "Este email já foi verificado"
        });
      }
      
      if (user.verificationCode !== code) {
        return res.status(400).json({
          message: "Código de verificação inválido"
        });
      }
      
      // Verificar o usuário
      await storage.updateUser(userId, {
        isVerified: true,
        verificationCode: null
      });
      
      // Autenticar o usuário após verificação
      const updatedUser = await storage.getUser(userId);
      if (!updatedUser) {
        throw new Error("Erro ao buscar usuário após verificação");
      }
      
      req.login(updatedUser, (err: Error | null) => {
        if (err) return next(err);
        res.status(200).json({
          message: "Email verificado com sucesso!",
          user: req.user
        });
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Rota para reenviar código de verificação
  app.post("/api/resend-verification", async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          message: "Email não fornecido"
        });
      }
      
      const user = await storage.getUserByUsername(email);
      
      if (!user) {
        return res.status(404).json({
          message: "Usuário não encontrado"
        });
      }
      
      if (user.isVerified) {
        return res.status(400).json({
          message: "Este email já foi verificado"
        });
      }
      
      // Gerar novo código de verificação
      const verificationCode = generateVerificationCode();
      
      // Atualizar o código no banco de dados
      await storage.updateUser(user.id, {
        verificationCode
      });
      
      // Enviar email com o novo código de verificação
      try {
        const emailResult = await resendVerificationCode(
          user.username,
          verificationCode,
          user.fullName
        );
        
        if (emailResult.success) {
          log(`Novo código de verificação enviado com sucesso para ${user.username}`);
        } else {
          log(`Falha ao enviar novo código de verificação: ${emailResult.error}`);
        }
      } catch (error) {
        log(`Erro ao enviar novo código de verificação: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Não enviamos o código na resposta, pois ele será enviado por email
      res.status(200).json({
        message: "Um novo código de verificação foi enviado para seu email.",
        userId: user.id
      });
    } catch (error) {
      next(error);
    }
  });
}
