# REST API Reference

All protected endpoints require a valid JWT in the HTTP Authorization header:  
`Authorization: Bearer <jwt_token>`

## 1. Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns user payload + JWT. |
| `GET` | `/api/auth/me` | Protected | Returns safe user session profile for current token. |

## 2. Daily Camps & Screenings (`/api/camps`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/camps` | ANM, MO, Admin | Fetches camp sheet via `?date=YYYY-MM-DD&village=Name`. |
| `POST`| `/api/camps/carry-forward` | ANM, MO | Copies closing stock from previous recorded day. |
| `PUT` | `/api/camps/:id` | ANM, MO | Updates stock inflows/damaged quantities. |
| `POST`| `/api/camps/:id/lock` | **Medical Officer** | Locks camp sheet, freezing edits. |
| `POST`| `/api/camps/:id/unlock` | **Block Admin** | Unlocks a frozen camp sheet. |
| `POST`| `/api/camps/screenings` | ANM, MO | Records vitals, executes CDSS, saves record. |
| `POST`| `/api/camps/screenings/:id/send-card`| ANM, MO | Marks WhatsApp digital health card as sent. |

## 3. Beneficiaries & Risk Ledger (`/api/beneficiaries`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/beneficiaries` | All Roles | Lists registered mothers. *(ASHA is restricted to own village).* |
| `POST`| `/api/beneficiaries` | ANM, MO | Registers a new antenatal mother, calculates EDD. |
| `GET` | `/api/beneficiaries/watchlist` | All Roles | Returns critical high-risk mothers and overdue visits. |
| `GET` | `/api/beneficiaries/:id/timeline` | All Roles | Returns chronological screening history for passbook. |

## 4. MMU & 108 Emergency Ambulance (`/api/ambulance`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/ambulance` | All Roles | Returns vehicle trip logs and analytics. |
| `POST`| `/api/ambulance` | ANM, MO | Creates transit log, computes mileage, links patient. |

## 5. Reports & Users
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/monthly` | ANM, MO, Admin | Returns 31-day aggregated HMIS matrix. |
| `GET` | `/api/users` | MO, Admin | Lists health personnel. MO scoped to own PHC. |
| `POST`| `/api/users` | **Block Admin** | Provisions a new user account with hashed password. |