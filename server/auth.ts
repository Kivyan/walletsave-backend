import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, InsertCategory } from "@shared/schema";
import { DEFAULT_CATEGORIES } from "../client/src/lib/utils";

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
        return res.status(400).send("Formato de email inválido");
      }

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Este email já está cadastrado");
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

      // Ao invés de fazer login, primeiro exigimos a verificação
      // Podemos simular o envio de um email exibindo o código na resposta (apenas para demonstração)
      // Em produção, não mostraríamos o código na resposta
      res.status(201).json({
        message: "Conta criada com sucesso! Por favor, verifique seu email.",
        verificationCode,
        userId: user.id,
        email: user.username
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({
          message: info?.message || "Email ou senha inválidos"
        });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json(req.user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
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
      
      req.login(updatedUser, (err) => {
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
      
      // Em produção, enviaríamos um email real aqui
      // Para demonstração, retornamos o código na resposta
      res.status(200).json({
        message: "Novo código de verificação enviado!",
        verificationCode,
        userId: user.id
      });
    } catch (error) {
      next(error);
    }
  });
}
