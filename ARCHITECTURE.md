# SecureIT - Arquitetura Completa da Plataforma

## Visao Geral

SecureIT e um sistema de seguranca inteligente com reconhecimento facial e deteccao de pessoas. A plataforma e composta por 4 componentes:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SECUREIT PLATFORM                          │
├─────────────────┬──────────────────┬───────────────────────────────┤
│   DESKTOP APP   │    API BACKEND   │         WEB APP               │
│   (Tauri +      │   (FastAPI +     │    (Next.js +                 │
│    React +      │    Python +      │     Prisma +                  │
│    Vite)        │    PostgreSQL +  │     SQLite)                   │
│                 │    pgvector +    │                               │
│   Porta 1420    │    YOLO +        │    Porta 3000                 │
│   (dev)         │    MTCNN +       │                               │
│                 │    ResNet)       │                               │
│                 │                  │                               │
│                 │   Porta 8000     │                               │
├─────────────────┴──────────────────┴───────────────────────────────┤
│                      MOBILE APP (futuro)                           │
│              (React Native / Flutter)                               │
│          Acede aos servicos via internet ou rede local             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. API BACKEND (FastAPI - Python)

**Localizacao:** `api/`
**Porta:** 8000
**Framework:** FastAPI v0.138
**ORM:** Tortoise-ORM + pgvector (PostgreSQL)
**Modelos de IA:** YOLO (deteccao de pessoas), MTCNN + ResNet (reconhecimento facial)

### 1.1 Endpoints REST

#### Autenticacao (`/api/auth`)

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| POST | `/api/auth/signup` | Registar utilizador (email, password >=12 chars, PIN 4 digitos, nome, telemovel) | Nao |
| POST | `/api/auth/login` | Login com email+password | Nao |
| POST | `/api/auth/pin-login` | Login com email+PIN | Nao |
| POST | `/api/auth/pin` | Verificar PIN, obter pin_token | Nao |
| POST | `/api/auth/re-auth` | Re-autenticar com PIN (igual a pin-login) | Nao |
| GET | `/api/auth/accounts` | Listar todos os utilizadores | Nao |
| GET | `/api/auth/me` | Obter perfil do utilizador atual | Sim |
| GET | `/api/auth/check` | Verificar se o token e valido | Sim |

#### Camaras (`/api/cameras`)

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | `/api/cameras` | Listar camaras do utilizador (pesquisa por localizacao, paginada) | Sim |
| POST | `/api/cameras` | Criar camara (nome, localizacao, tipo L/W, infoconexao) | Sim |
| GET | `/api/cameras/available` | Listar camaras locais via cv2 | Sim |
| GET | `/api/cameras/{id}` | Obter detalhe da camara | Sim |
| PUT | `/api/cameras/{id}` | Atualizar camara | Sim |
| DELETE | `/api/cameras/{id}` | Eliminar camara | Sim |

- **Tipo L (Local):** Camaras USB/conectadas ao computador. `connection_info` contem `path` ou `id`.
- **Tipo W (WiFi/Rede):** Streams RTSP/HTTP. `connection_info` contem `stream_url`.

#### Pessoas (`/api/people`)

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | `/api/people` | Listar pessoas (pesquisa por nome, paginada) | Sim |
| POST | `/api/people` | Criar pessoa (nome, foto base64, roles, banned) | Sim |
| GET | `/api/people/{id}` | Obter pessoa com roles | Sim |
| PUT | `/api/people/{id}` | Atualizar pessoa | Sim |
| DELETE | `/api/people/{id}` | Eliminar pessoa | Sim |
| POST | `/api/people/search-by-face` | Pesquisar pessoa por foto (base64) | Sim |

#### Roles (`/api/people/roles`)

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | `/api/people/roles` | Listar roles | Sim |
| POST | `/api/people/roles` | Criar role (nome, descricao, campos customizados) | Sim |
| GET | `/api/people/roles/{id}` | Obter role com campos | Sim |
| PUT | `/api/people/roles/{id}` | Atualizar role e campos | Sim |
| DELETE | `/api/people/roles/{id}` | Eliminar role | Sim |

#### Notificacoes (`/api/notifications`)

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | `/api/notifications` | Listar notificacoes (filtro: A=todas, NR=nao lidas, R=lidas, paginada) | Sim |
| DELETE | `/api/notifications/{id}` | Eliminar notificacao (soft delete) | Sim |
| GET | `/api/notifications/unread-count` | Contagem de nao lidas | Sim |

#### Painel / Configuracoes (`/api/panel`, `/api/settings`)

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | `/api/panel` | Dados do dashboard (lista camaras + contagem nao lidas) | Sim |
| GET | `/api/settings` | Obter configuracao do utilizador | Sim |
| PUT | `/api/settings` | Atualizar configuracao (fps, horarios, cooldown, deteccao, desenho) | Sim |

#### Deteccao Facial (`/api/face-detections`)

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | `/api/face-detections` | Listar deteccoes (paginada, filtro known_only) | Sim |

#### Saude (`/api`)

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | `/api/health` | Health check | Nao |

### 1.2 WebSocket Endpoints

#### `/ws/area-detection`
- **Query params:** `token` (JWT), `camera_id`, `vs` (fonte video)
- **Auth:** Token validado via query param
- **Fluxo:**
  1. Autenticar, aceitar WebSocket
  2. Carregar config do utilizador (fps, alert_cooldown, detect_every, allow_draw, horarios)
  3. Criar `CameraService(video_source, fps, allow_draw)`
  4. Definir status da camara como True na DB
  5. Iniciar loop de streaming:
     - A cada `detect_every` frames: correr inferencia YOLO, contar pessoas (classe 0)
     - Se desenho ativo: desenhar retangulos
     - A cada frame: enviar bytes JPEG ao cliente
     - Se pessoas detectadas durante horario de monitorizacao, cooldown passado, e contagem alterada: criar notificacao + enviar `{"type":"notification","people":N}`
  6. Na desconexao: cleanup, status False

#### `/ws/face-recognition`
- **Query params:** `token` (JWT), `camera_id`, `vs` (fonte video)
- **Auth:** Token validado via query param
- **Fluxo:**
  1. Autenticar, aceitar WebSocket
  2. Carregar config do utilizador
  3. Criar `CameraService(video_source, fps, allow_draw=False)`
  4. Iniciar loop de streaming:
     - A cada `detect_every` frames:
       - Converter frame para PIL, chamar `detect_faces_in_frame()` (MTCNN deteccao + ResNet embedding)
       - Para cada face > 0.9 confianca: pesquisar na DB por embedding (similaridade cosseno via pgvector)
       - Construir lista com bbox, person_id, name, unknown, confianca
     - Desenhar retangulos (verde = conhecido, vermelho = desconhecido)
     - Enviar JPEG a cada frame
     - Enviar JSON `{"type":"faces","faces":[...]}` nos frames de deteccao
     - Em match de face conhecida (cooldown 30s por pessoa): enviar `{"type":"face_match",...}` e guardar deteccao
     - Em face desconhecida (cooldown 60s): guardar deteccao como desconhecida
  5. Na desconexao: cleanup, status False

### 1.3 Autenticacao Backend

```
JWT (HS256) com expiracao de 365 dias
Payload: {"sub": user_id, "exp": timestamp}

Middleware:
  - /api/auth/*  -> PUBLICO
  - /media/*     -> PUBLICO
  - /ws/*        -> PUBLICO (auth via query param)
  - /api/health  -> PUBLICO
  - Todo o resto -> Requer Bearer token no header Authorization

Fluxo:
  Client -> Authorization: Bearer eyJ...
  -> AuthMiddleware.decode_access_token
  -> User.get_or_none(id=payload.sub)
  -> request.state.user = user
  -> Se nao autenticado e path nao publico -> 401
```

### 1.4 Modelos de IA

#### YOLO (Deteccao de Pessoas)
- **Modelo:** `yolo11n.pt` (YOLO nano)
- **Device:** CUDA se disponivel, senao CPU
- **Parametros:** `imgsz=320`, `conf=0.3`
- **Classe detectada:** Classe 0 (pessoa)

#### FaceNet (Reconhecimento Facial)
- **Deteccao:** MTCNN (`image_size=320`, `margin=0`, CPU)
- **Embedding:** InceptionResnetV1 (pretrained `vggface2`, 512-dim, CPU)
- **Fluxo:**
  1. MTCNN detecta face no frame
  2. ResNet gera embedding de 512 dimensoes
  3. Embedding guardado na DB (pgvector com indice HNSW)
  4. Para reconhecimento: similaridade cosseno > threshold

### 1.5 CameraService

- Aceita: int (indice camera), string (URL RTSP/HTTP), path de ficheiro video
- Thread daemon que le frames continuamente ao FPS alvo
- Para ficheiros de video: volta ao frame 0 quando termina
- `get_frame(detect)`: corre YOLO (se detect=True), retorna (JPEG bytes, people_count)

### 1.6 Stack Tecnica Backend

| Componente | Tecnologia |
|-----------|-----------|
| Framework | FastAPI v0.138 |
| ORM | Tortoise-ORM |
| Base de dados | PostgreSQL + pgvector |
| Autenticacao | JWT (python-jose) + bcrypt |
| Deteccao pessoas | YOLO (ultralytics) |
| Deteccao facial | MTCNN + InceptionResnetV1 |
| Video | OpenCV (cv2) |
| Containerizacao | Docker |

---

## 2. DESKTOP APP (Tauri + React + Vite)

**Localizacao:** `frontend/apps/desktop/`
**Porta:** 1420 (dev)
**Stack:** React 19 + Tauri 2 + Vite 7 + Zustand 5 + TanStack Query 5

### 2.1 Arquitetura

```
Desktop App (Tauri Shell)
    │
    ├── React Frontend (Vite, porta 1420)
    │   │
    │   ├── REST API ──→ http://localhost:8000 (Backend API)
    │   │   ├── Auth endpoints → http://localhost:3000 (Web API!)
    │   │   ├── /api/cameras/*
    │   │   ├── /api/people/*
    │   │   ├── /api/notifications/*
    │   │   ├── /api/settings
    │   │   ├── /api/face-detections
    │   │   ├── /api/licenses/*
    │   │   └── /api/auth/me, /api/auth/check
    │   │
    │   ├── WebSocket ──→ ws://localhost:8000/ws/{consumer}?token={jwt}&camera_id={id}&vs={vs}
    │   │   ├── area-detection (JPEG binario + JSON)
    │   │   └── face-recognition (JPEG binario + JSON)
    │   │
    │   └── State Management
    │       ├── Zustand stores (auth, reauth, camera/person view, detections, toasts, license)
    │       ├── TanStack Query (server state)
    │       └── localStorage (access_token, license, theme, machine_hash)
    │
    └── Tauri Rust Backend (shell fino, apenas greet + opener plugin)
```

**IMPORTANTE:** O Tauri backend e apenas um wrapper nativo. Toda a logica de negocio acontece no frontend React que comunicate com o backend API.

### 2.2 Rotas

| Rota | Componente | Auth |
|------|-----------|------|
| `/login` | Login | Nao |
| `/signup` | Signup | Nao |
| `/panel` | Dashboard (ProtectedRoute + PanelNoNavLayout) | Sim |
| `/` | Redirect para `/login` | Nao |

### 2.3 Dashboard - Arquitetura de Monitorizacao

O Dashboard e o nucleo da aplicacao. Implementa um **sistema de monitorizacao ao vivo com navegacao por paineis deslizantes**:

**Grelha de Camaras:**
- Busca todas as camaras via `useCameras()`
- Cria conexoes WebSocket para TODAS as camaras simultaneamente
- Consumer names: `"face-recognition"` ou `"area-detection"` baseado em `camera.face_recognition`
- Renderiza CSS grid: max 3 colunas, auto-rows, frames JPEG via `<img>`
- Frames atualizados via `URL.createObjectURL(blob)` com revogacao apos 1s

**Processamento de Eventos de Deteccao:**
- `notification` com `people` count → "N pessoas detectadas"
- `face_match` com `person_id` → Face conhecida
- `faces` array → Deteccoes individuais
- Eventos guardados em `useDetectionEventsStore` (max 100)

**Componentes de Layout:**
- `DetectionSidebar`: Painel direito com eventos em tempo real
- `FloatingNavbar`: Barra flutuante inferior (Camaras, Pessoas, Notificacoes, Licenca, Configuracoes)
- `PanelSheet`: Painel deslizante que sobrepoe a grelha quando um item de nav e selecionado

### 2.4 Gestao de Estado (Zustand Stores)

| Store | Proposito | Persistencia |
|-------|-----------|-------------|
| `useAuthStore` | user, accessToken | localStorage |
| `useReAuthStore` | Modal de re-autenticacao com Promise-based flow | Nao |
| `useCameraViewStore` | ID da camara atualmente visualizada | Nao |
| `usePersonViewStore` | ID da pessoa atualmente visualizada | Nao |
| `useDetectionEventsStore` | Eventos de deteccao em tempo real (max 100) | Nao |
| `useToastStore` | Notificacoes toast | Nao |
| `useLicenseStore` | Dados da licenca | localStorage |

### 2.5 Hooks Principais

| Hook | Descricao |
|------|-----------|
| `useAuth` | Login, signup, email code, TOTP, fetchMe, logout |
| `useCameras` | React Query: listar, obter por ID |
| `usePeople` | React Query: listar (paginado + pesquisa), obter por ID |
| `useNotifications` | React Query: listar, eliminar |
| `useSettings` | React Query: obter, atualizar |
| `useFaceDetections` | React Query: paginado |
| `useLicense` | Envolve license store, calcula: maxCameras, maxPeople, faceRecognition |
| `useLicenseValidation` | Validacao periodica (6h), alertas de expiracao |

### 2.6 Stack Tecnica Desktop

| Componente | Tecnologia |
|-----------|-----------|
| Shell nativo | Tauri 2 (Rust) |
| Frontend | React 19 + TypeScript |
| Bundler | Vite 7 |
| UI Library | shadcn/ui + Radix UI |
| Animacoes | Framer Motion |
| Icones | Lucide React |
| State | Zustand 5 |
| Server State | TanStack Query 5 |
| Estilos | Tailwind CSS v4 |
| Fontes | Inter + Space Grotesk |

---

## 3. WEB APP (Next.js + Prisma)

**Localizacao:** `frontend/apps/web/`
**Porta:** 3000
**Stack:** Next.js 14 + Prisma 6 + SQLite (dev) / PostgreSQL (prod)

### 3.1 Papel na Plataforma

O web app serve como:
1. **Portal de autenticacao** - Login/Signup de utilizadores
2. **Gestao de conta** - Perfil, TOTP/2FA, email verification
3. **Painel de administracao** - Gestao de licencas (gerar, listar, revogar)
4. **Ativacao de licencas** - Endpoint publico para o desktop ativar licencas
5. **Validacao de licencas** - Endpoint publico para o desktop validar licencas

### 3.2 Endpoints REST

#### Autenticacao Utilizador (`/api/auth`)

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| POST | `/api/auth/signup` | Registar (email, password >=12 chars, nome) | Nao |
| POST | `/api/auth/login` | Login email+password | Nao |
| GET | `/api/auth/me` | Obter perfil + licenca | Cookie |
| POST | `/api/auth/email-code/send` | Enviar codigo verificacao | Nao |
| POST | `/api/auth/email-code/verify` | Verificar codigo → login | Nao |
| POST | `/api/auth/totp/setup` | Configurar TOTP (requer sessao) | Cookie |
| POST | `/api/auth/totp/verify` | Verificar codigo TOTP | Cookie |

#### Autenticacao Admin (`/api/admin`)

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| POST | `/api/admin/login` | Login admin email+password | Nao |
| GET | `/api/admin/licenses` | Listar licencas (paginado) | Cookie |
| GET | `/api/admin/licenses/[id]` | Detalhe licenca | Cookie |
| POST | `/api/admin/licenses/generate` | Gerar licencas (1-100) | Cookie |
| DELETE | `/api/admin/licenses/[id]` | Revogar licenca | Cookie |

#### Licencas Publicas

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| POST | `/api/licenses/activate` | Ativar licenca com chave | Nao |
| POST | `/api/licenses/validate` | Validar licenca | Nao |

### 3.3 Modelo de Base de Dados

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│    User      │     │   LicenseKey │     │   License    │
├─────────────┤     ├──────────────┤     ├─────────────┤
│ id           │←────│ id           │←────│ id           │
│ email        │     │ key (unique) │     │ keyId (FK)   │
│ passwordHash │     │ type         │     │ userId (FK)  │
│ firstName    │     │ durationDays │     │ activatedAt  │
│ lastName     │     │ status       │     │ expiresAt    │
│ phone?       │     │ batchName?   │     │ lastChecked? │
│ totpSecret?  │     │ createdAt    │     │ machineHash? │
│ totpEnabled  │     └──────────────┘     │ createdAt    │
│ isActive     │                          └─────────────┘
│ createdAt    │
└─────────────┘

┌──────────────┐     ┌─────────────┐
│  AdminUser   │     │  EmailCode   │
├──────────────┤     ├─────────────┤
│ id           │     │ id           │
│ email        │     │ email        │
│ passwordHash │     │ code         │
│ createdAt    │     │ expiresAt    │
└──────────────┘     │ used         │
                     │ createdAt    │
                     └─────────────┘
```

**Relacoes:**
- User 1:1 License (um utilizador so pode ter uma licenca)
- LicenseKey 1:1 License (uma chave so pode ser ativada uma vez)
- EmailCode: temporario para verificacao de email

### 3.4 Fluxo de Autenticacao

```
SIGNUP:
  /signup (wizard 3 passos) → POST /api/auth/signup
    → bcrypt hash password (12 rounds)
    → criar User na DB
    → criar JWT (365 dias)
    → set cookie "token" (httpOnly, sameSite lax)
    → retornar user JSON
    → frontend redireciona para /login

LOGIN (password):
  /login → POST /api/auth/login
    → procurar User por email
    → verificar isActive
    → bcrypt compare
    → criar JWT (365 dias)
    → set cookie "token"
    → retornar user JSON
    → frontend redireciona para /admin

LOGIN (codigo email):
  POST /api/auth/email-code/send
    → procurar User por email
    → gerar codigo 6 digitos (nanoid), 10min validade
    → guardar na tabela EmailCode
    → console.log codigo (SMTP nao implementado)
  POST /api/auth/email-code/verify
    → encontrar codigo valido nao utilizado
    → marcar como usado
    → criar JWT + set cookie
    → retornar user JSON

MIDDLEWARE:
  /                        → PUBLICO
  /login, /signup          → PUBLICO
  /api/auth/*              → PUBLICO
  /api/licenses/validate   → PUBLICO
  /admin/*                 → verificar cookie "admin_token"
  resto                    → verificar cookie "token" + JWT

ADMIN LOGIN:
  POST /api/admin/login
    → procurar AdminUser por email
    → bcrypt compare
    → criar JWT
    → set cookie "admin_token" (24h)
```

### 3.5 Geracao e Ativacao de Licencas

```
GERACAO (admin):
  POST /api/admin/licenses/generate
    → Formato da chave: SEC-XXXX-XXXX-XXXX-XXXX
    → Tipos: TRIAL ou STANDARD
    → Status inicial: PENDING
    → 1 a 100 por vez
    → Batch name opcional

ATIVACAO (desktop):
  POST /api/licenses/activate (PUBLICO)
    → Validar formato da chave (regex)
    → Verificar que chave existe e nao esta revogada
    → Se ja ativa e nao expirada: retornar info (idempotente)
    → Procurar user por email
    → Verificar que user nao tem licenca ativa
    → Criar License em transacao
    → Atualizar status da chave para ACTIVE
    → Retornar info da licenca + daysRemaining

VALIDACAO (desktop, a cada 6h):
  POST /api/licenses/validate (PUBLICO)
    → Procurar license por ID
    → Verificar que chave nao esta revogada
    → Atualizar lastChecked
    → Retornar validade, expiracao, dias restantes
```

### 3.6 Stack Tecnica Web

| Componente | Tecnologia |
|-----------|-----------|
| Framework | Next.js 14 (App Router) |
| ORM | Prisma 6 |
| Base de dados | SQLite (dev) / PostgreSQL (prod) |
| JWT | jose (HS256) |
| Senhas | bcryptjs |
| 2FA | otpauth (TOTP) |
| UI | Tailwind CSS v3 + lucide-react |
| Fontes | Inter + Space Grotesk |

---

## 4. FLUXO COMPLETO OAUTH-LIKE

### 4.1 Fluxo de Registo e Primeira Utilizacao

```
UTILIZADOR                           DESKTOP                    WEB                    API
    │                                  │                        │                      │
    │  1. Abre Desktop                 │                        │                      │
    │  ───────────────────────────────>│                        │                      │
    │                                  │                        │                      │
    │  2. Desktop verifica se ha       │  GET /api/auth/accounts│                      │
    │     contas existentes            │  ────────────────────────────────────────────>│
    │                                  │  <────────────────────────────────────────────│
    │                                  │                        │                      │
    │  3a. Sem contas → /signup        │                        │                      │
    │  3b. Com contas → /login         │                        │                      │
    │                                  │                        │                      │
    │  4. Utilizador preenche form     │                        │                      │
    │     (email, nome, password)      │                        │                      │
    │  ───────────────────────────────>│                        │                      │
    │                                  │  POST /api/auth/signup │                      │
    │                                  │  ────────────────────────────────────────────>│
    │                                  │  <────────────────────────────────────────────│
    │                                  │  (JWT 365d + cookie)   │                      │
    │                                  │                        │                      │
    │  5. Redirect para /login         │                        │                      │
    │  ───────────────────────────────>│                        │                      │
    │                                  │                        │                      │
    │  6. Utilizador faz login         │  POST /api/auth/login  │                      │
    │     (email + password)           │  ────────────────────────────────────────────>│
    │                                  │  <────────────────────────────────────────────│
    │                                  │  (JWT 365d + cookie)   │                      │
    │                                  │                        │                      │
    │  7. Desktop guarda token         │                        │                      │
    │     no localStorage              │                        │                      │
    │                                  │                        │                      │
    │  8. Redirect para /panel         │                        │                      │
    │     (Dashboard)                  │                        │                      │
    │                                  │                        │                      │
```

**NOTA IMPORTANTE:** O desktop faz login/signup no **Web App** (porta 3000), nao na API backend (porta 8000). O token JWT gerado pelo web app e usado em ambos.

### 4.2 Fluxo de Ativacao de Licenca

```
UTILIZADOR                           DESKTOP                    WEB                    API
    │                                  │                        │                      │
    │  1. Va a Licenca no painel       │                        │                      │
    │  ───────────────────────────────>│                        │                      │
    │                                  │                        │                      │
    │  2. Introduz chave               │                        │                      │
    │     SEC-XXXX-XXXX-XXXX-XXXX     │                        │                      │
    │  ───────────────────────────────>│                        │                      │
    │                                  │                        │                      │
    │                                  │  POST /api/licenses/activate                │
    │                                  │  {key, email, machineHash}                  │
    │                                  │  ────────────────────────────────────────────>│
    │                                  │  <────────────────────────────────────────────│
    │                                  │  (license info)        │                      │
    │                                  │                        │                      │
    │  3. Desktop guarda licenca       │                        │                      │
    │     no localStorage              │                        │                      │
    │                                  │                        │                      │
    │  4. A cada 6 horas:              │                        │                      │
    │     POST /api/licenses/validate  │                        │                      │
    │     {licenseId, machineHash}     │                        │                      │
    │     ─────────────────────────────────────────────────────>│                      │
    │                                  │                        │                      │
```

### 4.3 Fluxo de Monitorizacao (Tempo Real)

```
DESKTOP                              API
    │                                 │
    │  1. Conectar WebSocket          │
    │  ws://localhost:8000/ws/        │
    │  area-detection?token=X         │
    │  &camera_id=Y&vs=Z             │
    │  ─────────────────────────────>│
    │  <─────────────────────────────│
    │  (conexao aceite)              │
    │                                 │
    │  2. API inicia CameraService   │
    │     + thread de leitura        │
    │                                 │
    │  3. A cada frame:              │
    │  <─────── JPEG bytes ──────────│
    │                                 │
    │  4. A cada detect_every:       │
    │  <───── JPEG + YOLO result ────│
    │                                 │
    │  5. Se pessoas detectadas:     │
    │  <───── {"type":"notification", │
    │          "people":N} ──────────│
    │                                 │
    │  6. Desktop cria notificacao   │
    │     + mostra na sidebar        │
    │                                 │
    │  7. Desconectar:               │
    │  ───── close ─────────────────>│
    │  (cleanup, status=False)       │
```

### 4.4 Fluxo de Reconhecimento Facial

```
DESKTOP                              API
    │                                 │
    │  1. Conectar WebSocket          │
    │  ws://localhost:8000/ws/        │
    │  face-recognition?token=X       │
    │  &camera_id=Y&vs=Z             │
    │  ─────────────────────────────>│
    │                                 │
    │  2. API: MTCNN detecta face    │
    │     ResNet gera embedding       │
    │     pgvector busca similar      │
    │                                 │
    │  3. Frame com retangulos:      │
    │  <─────── JPEG bytes ──────────│
    │  (verde=conhecido,             │
    │   vermelho=desconhecido)       │
    │                                 │
    │  4. Face conhecida:            │
    │  <───── {"type":"face_match",  │
    │          "person_id":N,        │
    │          "name":"..."} ────────│
    │                                 │
    │  5. Desktop: abrir Inspector   │
    │     Panel com detalhes         │
    │                                 │
    │  6. Faces detectadas:          │
    │  <───── {"type":"faces",       │
    │          "faces":[...]} ────────│
    │                                 │
    │  7. Desktop: atualizar         │
    │     DetectionSidebar           │
    │                                 │
```

---

## 5. MOBILE APP (FUTURO)

### 5.1 Conceito

O app mobile sera um cliente que acede aos servicos da SecureIT para:
- Ver video das camaras do desktop **pela internet** (via API backend)
- Ver video das camaras **na rede local** (direto ao desktop)
- Receber notificacoes push de deteccao
- Gerir pessoas e roles
- Ver historico de deteccoes

### 5.2 Arquitetura Pretendida

```
MOBILE APP
    │
    ├── Modo Online (Internet)
    │   ├── REST API → https://api.secureit.com:8000 (API Backend)
    │   ├── WebSocket → wss://api.secureit.com:8000/ws/...
    │   └── Autenticacao via JWT (obtido via Web App OAuth flow)
    │
    ├── Modo Local (Rede)
    │   ├── REST API → http://192.168.x.x:8000 (Desktop Local)
    │   ├── WebSocket → ws://192.168.x.x:8000/ws/...
    │   └── Mesmo JWT, API local valida
    │
    └── Notificacoes Push
        ├── FCM (Firebase Cloud Messaging) para Android
        ├── APNs para iOS
        └── Backend envia push quando detecta pessoa
```

### 5.3 Autenticacao OAuth-Like

```
MOBILE                           WEB APP                    API
    │                               │                        │
    │  1. Abrir browser/WebView     │                        │
    │     para /login               │                        │
    │  ───────────────────────────>│                        │
    │                               │                        │
    │  2. User faz login            │  POST /api/auth/login  │
    │     (email + password)        │  ─────────────────────>│
    │                               │  <─────────────────────│
    │                               │  (JWT)                 │
    │                               │                        │
    │  3. Web app redireciona       │                        │
    │     para deep link:           │                        │
    │     secureit://auth?token=X   │                        │
    │  <────────────────────────────│                        │
    │                               │                        │
    │  4. Mobile recebe token       │                        │
    │     e guarda no Keychain/     │                        │
    │     SharedPreferences         │                        │
    │                               │                        │
    │  5. Todas as chamadas API     │                        │
    │     usam Authorization:       │                        │
    │     Bearer {token}            │                        │
    │  ──────────────────────────────────────────────────────>│
    │                               │                        │
```

---

## 6. COMUNICACAO ENTRE COMPONENTES

### 6.1 Diagrama de Comunicacao Completo

```
┌──────────────┐      HTTP/WS       ┌──────────────┐      HTTP/WS       ┌──────────────┐
│              │ ─────────────────> │              │ <───────────────── │              │
│  DESKTOP APP │                    │  API BACKEND │                    │   WEB APP    │
│  (Tauri)     │ <───────────────── │  (FastAPI)   │ ─────────────────> │  (Next.js)   │
│              │                    │              │                    │              │
│  Porta 1420  │    JWT (365d)     │  Porta 8000  │    JWT (365d)     │  Porta 3000  │
│              │ ─────────────────> │              │ <───────────────── │              │
└──────────────┘                    └──────────────┘                    └──────────────┘
                                            │
                                     ┌──────┴──────┐
                                     │             │
                                     │ PostgreSQL  │
                                     │ + pgvector  │
                                     │             │
                                     └─────────────┘

COMUNICACAO:
  Desktop → Web: Login/Signup (porta 3000)
  Desktop → API: Tudo o resto (porta 8000)
  Web → Desktop: Licenca activation (porta 8000)
  Web → API: Validacao de licenca (porta 8000)
  API → Web: N/A (API nao fala com Web diretamente)
  Mobile → Web: Login/Signup (porta 3000)
  Mobile → API: Streaming, dados (porta 8000)
```

### 6.2 Tokens e Autenticacao

| Componente | Token | Expiracao | Cookie |
|-----------|-------|-----------|--------|
| Web App (user) | JWT (HS256) | 365 dias | `token` (httpOnly) |
| Web App (admin) | JWT (HS256) | 24 horas | `admin_token` (httpOnly) |
| API Backend | JWT (HS256) | 365 dias | N/A (Bearer header) |
| Desktop | JWT (HS256) | 365 dias | N/A (localStorage) |
| WebSocket | JWT (HS256) | 365 dias | N/A (query param) |

**NOTA:** Todos os componentes usam o mesmo segredo JWT (`JWT_SECRET`) e geram tokens com o mesmo formato. O desktop faz login no web app e usa o token obtido para falar com a API backend.

### 6.3 Endpoints Publicos vs Protegidos

#### Publicos (sem auth):
- `/api/auth/signup`, `/api/auth/login` (Web)
- `/api/auth/email-code/*` (Web)
- `/api/auth/accounts` (API)
- `/api/licenses/activate` (Web)
- `/api/licenses/validate` (Web)
- `/api/health` (API)
- `/media/*` (API - imagens de deteccao)
- `/ws/*` (API - auth via query param)

#### Protegidos (requer JWT):
- `/api/cameras/*` (API)
- `/api/people/*` (API)
- `/api/notifications/*` (API)
- `/api/settings` (API)
- `/api/face-detections` (API)
- `/api/panel` (API)
- `/admin/*` (Web - cookie)
- `/api/auth/me` (Web - cookie)
- `/api/admin/*` (Web - cookie)

---

## 7. PROBLEMAS CONHECIDOS

1. **Admin auth cookie mismatch:** Admin login seta cookie `admin_token`, mas as API routes admin leem cookie `token`
2. **TOTP nao e verificado no login:** Mesmo com TOTP ativo, login so precisa de password
3. **SMTP nao implementado:** Codigos de email so sao impressos no console
4. **JWT 365 dias sem revocacao:** Nao ha endpoint de logout nem invalidacao de token
5. **Signup auto-login mas redirect para /login:** API seta cookie mas frontend redireciona
6. **Login redireciona para /admin:** Utilizador normal vai para o painel admin
7. **Activacao de licenca publica:** Qualquer pessoa com chave e email pode ativar
8. **Refresh token definido mas nao utilizado:** `createToken` suporta tipo "refresh" (7d) mas nunca e emitido
9. **Middleware admin so verifica presenca do cookie:** Nao verifica validade do JWT

---

## 8. STACK TECNICA COMPLETA

| Componente | Tecnologia | Versao |
|-----------|-----------|--------|
| **API Backend** | | |
| Framework | FastAPI | 0.138 |
| ORM | Tortoise-ORM | - |
| BD | PostgreSQL | - |
| Vector DB | pgvector | - |
| IA - Deteccao | YOLO (ultralytics) | yolo11n |
| IA - Facial | MTCNN + InceptionResnetV1 | - |
| Video | OpenCV (cv2) | - |
| Auth | python-jose + bcrypt | - |
| Container | Docker | - |
| **Desktop** | | |
| Shell | Tauri | 2 |
| Frontend | React + TypeScript | 19 |
| Bundler | Vite | 7 |
| UI | shadcn/ui + Radix UI | - |
| Animacoes | Framer Motion | 12 |
| Icones | Lucide React | - |
| State | Zustand | 5 |
| Server State | TanStack Query | 5 |
| Estilos | Tailwind CSS | 4 |
| **Web** | | |
| Framework | Next.js (App Router) | 14 |
| ORM | Prisma | 6 |
| BD | SQLite (dev) / PostgreSQL (prod) | - |
| JWT | jose | 6 |
| 2FA | otpauth | 9 |
| UI | Tailwind CSS + lucide-react | 3 |
| **Mobile (futuro)** | | |
| Framework | React Native / Flutter | - |
| Push | FCM + APNs | - |
| Camera | WebRTC / HLS | - |

---

## 9. VARIAVEIS DE AMBIENTE

### API Backend (`api/.env`)
```
# Configuracao do servidor
HOST=0.0.0.0
PORT=8000

# Base de dados
DATABASE_URL=postgresql://...

# JWT
SECRET_KEY=...
ACCESS_TOKEN_EXPIRE_MINUTES=525600  (365 dias)

# YOLO
YOLO_PATH=./yolo

# Media
MEDIA_ROOT=./media
```

### Web App (`frontend/apps/web/.env.local`)
```
DATABASE_URL="file:./dev.db"          # SQLite para dev
JWT_SECRET="x4$n!bnme4(khao6sy@8t*x&d1jn@#xk4^*u41-v20=5(2c55-"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:8000"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
```

### Desktop (`frontend/apps/desktop/.env`)
```
VITE_API_URL=http://localhost:8000
```

---

*Documento gerado em Julho 2026 - SecureIT v0.2.0*
