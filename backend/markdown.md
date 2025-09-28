# Users API Reference

## Profiles

### Create Profile  
**POST** `/users/profiles`  
Creates a new user profile.

| Type | Name | Location | Description |
|------|------|----------|-------------|
| Body | `UserProfileCreate` | JSON | `{ user_id, username, email, last_seen?, score_streak? }` |

Returns `UserProfile` with `last_seen` set to the current timestamp and `score_streak` initialized.

---

### Get Profile  
**GET** `/users/profiles/{user_id}`  
Fetches a profile and updates the streak if the last visit was within 24 hours.

| Type | Name | Location |
|------|------|----------|
| Path | `user_id` | `/users/profiles/{user_id}` |

Returns the updated `UserProfile`.

---

### Edit Profile  
**PATCH** `/users/profiles/{user_id}`  
Updates profile fields.

| Type | Name | Location | Description |
|------|------|----------|-------------|
| Path | `user_id` | `/users/profiles/{user_id}` | |
| Body | `EditProfile` | JSON | Optional `username`, `email` |

Returns the modified `UserProfile`.

---

### Get Score Streak  
**GET** `/users/profiles/{user_id}/score-streak`  
Retrieves the current streak counter.

| Type | Name | Location |
|------|------|----------|
| Path | `user_id` | `/users/profiles/{user_id}/score-streak` |

Response: `{ "user_id": "...", "score_streak": int }`

---

## Chat Sessions

### Create Chat Session  
**POST** `/users/chats`  
Starts a new chat.

| Type | Name | Location | Description |
|------|------|----------|-------------|
| Query | `user_id` | `?user_id=` | Required |
| Query | `chat_name` | `?chat_name=` | Optional |

Returns the created `ChatSession`.

---

### Add Chat Turn  
**POST** `/users/chats/{chat_id}/turns`  
Appends a message to a chat session.

| Type | Name | Location | Description |
|------|------|----------|-------------|
| Path | `chat_id` | `/users/chats/{chat_id}/turns` | |
| Body | `Message` | JSON | `{ turn, role, text, ... }` |

Returns the updated `ChatSession`.

---

### List User Chats  
**GET** `/users/chats/user/{user_id}`  
Returns all chat sessions for the user ordered by latest activity.

| Type | Name | Location |
|------|------|----------|
| Path | `user_id` | `/users/chats/user/{user_id}` |

Response: `List[ChatSession]` (metadata only).

---

### Get Chat Messages  
**GET** `/users/chats/{chat_id}/messages`  
Retrieves paginated chat history (25 messages per page).

| Type | Name | Location | Description |
|------|------|----------|-------------|
| Path | `chat_id` | `/users/chats/{chat_id}/messages` | |
| Query | `last_index` | `?last_index=` | Default `0`, must be ≥ 0 |

Returns `List[Message]`.

---

## Documents

### Upload Document  
**POST** `/users/upload/{user_id}`  
Stores an uploaded file in GridFS and records metadata.

| Type | Name | Location | Description |
|------|------|----------|-------------|
| Path | `user_id` | `/users/upload/{user_id}` | |
| Body | `file` | multipart/form-data | `UploadFile` |

Response: `{ "doc_id": "...", "file_name": "..." }`

---

### List Documents  
**GET** `/users/documents/{user_id}`  
Lists documents owned by the user.

| Type | Name | Location |
|------|------|----------|
| Path | `user_id` | `/users/documents/{user_id}` |

Response: `{ "documents": [{ doc_id, file_name, created_at }] }`

---

### Download Document  
**GET** `/users/documents/{user_id}/{doc_id}`  
Streams a stored document to the client.

| Type | Name | Location |
|------|------|----------|
| Path | `user_id` | `/users/documents/{user_id}/{doc_id}` |
| Path | `doc_id` | `/users/documents/{user_id}/{doc_id}` |

Returns the file as a download.