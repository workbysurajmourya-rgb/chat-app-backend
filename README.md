# Chat App Backend

A TypeScript + Node.js backend for a real-time chat application with:

- JWT-based authentication
- PostgreSQL persistence
- REST APIs for auth/users/messages
- Socket.IO for live messaging and online presence

## Tech Stack

- Node.js
- TypeScript
- Express
- PostgreSQL (`pg`)
- Socket.IO
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)

## Project Structure

```text
src/
  app.ts                     # Express app + route mounting
  server.ts                  # HTTP server + Socket.IO bootstrap
  config/
    db.ts                    # PostgreSQL pool config
  controllers/
    auth.controller.ts       # register/login
    user.controller.ts       # user list + account delete
    message.controller.ts    # chat history retrieval
  middleware/
    auth.middleware.ts       # JWT auth guard
  routes/
    auth.routes.ts
    user.routes.ts
    message.routes.ts
  socket/
    socket.ts                # realtime chat handlers
  types/
    socket.d.ts              # socket custom typings
```

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000

DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chat_app

JWT_SECRET=replace_with_a_long_random_secret
```

## Database Setup

Create a PostgreSQL database (example: `chat_app`) and run:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_participants_created
ON messages (sender_id, receiver_id, created_at);
```

## Install & Run

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## API Base URL

- Local: `http://localhost:5000`
- Base path: `/api`

## Authentication

Protected routes require a bearer token:

```http
Authorization: Bearer <jwt_token>
```

JWT is returned by:

- `POST /api/auth/register`
- `POST /api/auth/login`

## REST API Endpoints

### Auth

#### Register

- Method: `POST`
- Path: `/api/auth/register`
- Body:

```json
{
  "name": "Suraj",
  "email": "suraj@example.com",
  "password": "password123"
}
```

- Success (`201`):

```json
{
  "message": "User registered",
  "token": "<jwt>",
  "user": {
    "id": 1,
    "name": "Suraj",
    "email": "suraj@example.com",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

#### Login

- Method: `POST`
- Path: `/api/auth/login`
- Body:

```json
{
  "email": "suraj@example.com",
  "password": "password123"
}
```

- Success (`200`): returns `token` + user object

### Users (Protected)

#### Get all users except current user

- Method: `GET`
- Path: `/api/users/all`

#### Delete current user account

- Method: `DELETE`
- Path: `/api/users/me`
- Behavior: removes account and related sent/received messages in a DB transaction

### Messages (Protected)

#### Get conversation with a user

- Method: `GET`
- Path: `/api/messages/:receiverId`
- Behavior: returns both directions of messages ordered by `created_at ASC`

## Socket.IO

Socket authentication uses JWT from handshake auth:

```js
const socket = io("http://localhost:5000", {
  auth: { token: "<jwt_token>" }
});
```

### Client Events

- `get_online_users`
  - Request latest online users list
- `send_message`
  - Payload:

```json
{
  "receiverId": 2,
  "message": "Hello"
}
```

### Server Events

- `online_users`
  - Payload: array of online user IDs
- `receive_message`
  - Payload: saved message object from DB

## Error Responses

Common error patterns:

- `401`: Missing/invalid token (`No token provided`, `Invalid token`)
- `400`: Auth validation failure (`Invalid credentials`, `User already exists`)
- `500`: Server error

## Security Notes

- Never commit `.env`
- Use a strong `JWT_SECRET` in production
- Configure CORS with trusted origins (currently Socket.IO allows all origins)
- Use HTTPS in production

## Suggested Improvements

- Add request validation (e.g., `zod`/`joi`)
- Add refresh-token flow
- Add pagination for user list and message history
- Add rate limiting and helmet middleware
- Add test suite (unit + integration)

## License

ISC
