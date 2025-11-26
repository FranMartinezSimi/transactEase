# 🗺️ Database Map - Sealdrop (Real Schema)

**Generated from**: Live Supabase Database
**Project**: secure-files-sender (mmifzpfmlngtrjacviyy)
**Date**: November 2024

---

## 📋 Quick Reference: All Tables

| # | Table Name | Purpose | Records |
|---|------------|---------|---------|
| 1 | `organizations` | Multi-tenant orgs | Core |
| 2 | `profiles` | User profiles (auth.users extension) | Core |
| 3 | `deliveries` | Secure file deliveries | Core |
| 4 | `delivery_files` | Files attached to deliveries | Core |
| 5 | `access_logs` | Audit trail of all events | Audit |
| 6 | `delivery_access_codes` | 2FA verification codes | Security |
| 7 | `invitations` | Token-based org invitations | Auth |
| 8 | `organization_invitations` | SSO auto-assignment invitations | Auth |
| 9 | `organization_settings` | Org-level configuration | Config |
| 10 | `delivery_templates` | Reusable delivery templates | Feature |
| 11 | `subscriptions` | Billing & plan limits | Billing |
| 12 | `ComplianceCheck` | AI compliance scan results | Compliance |
| 13 | `compliance_reports` | Generated compliance PDFs | Compliance |
| 14 | `security_alerts` | Security event alerts | Security |
| 15 | `digital_signatures` | Document digital signatures | Compliance |
| 16 | `document_hashes` | File integrity hashes | Security |
| 17 | `custody_chain` | Chain of custody blockchain | Compliance |
| 18 | `cryptographic_keys` | PKI key management | Security |

---

## 🎯 Core Tables (Must Know)

### 1. **organizations**
Multi-tenant organization container.

```
id                    UUID PK
name                  TEXT
domain                TEXT        -- For SSO auto-assignment (e.g., "company.com")
logo_url              TEXT
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ

-- Access Control Lists
email_whitelist       TEXT[]
email_blacklist       TEXT[]
ip_whitelist          TEXT[]
ip_blacklist          TEXT[]
phone_whitelist       TEXT[]
only_internal_domain  BOOLEAN

-- Limits (DEPRECATED - use organization_settings)
max_expiration_hours  INT
min_expiration_hours  INT
max_views             INT
max_downloads         INT
```

**Relations:**
- `1:N` profiles
- `1:N` deliveries
- `1:1` organization_settings (not in schema yet)
- `1:N` invitations
- `1:1` subscriptions

---

### 2. **profiles**
User profiles (extends auth.users).

```
id                UUID PK (= auth.users.id)
organization_id   UUID FK → organizations
email             TEXT UNIQUE NOT NULL
full_name         TEXT NOT NULL
role              TEXT ('owner' | 'admin' | 'member')
is_active         BOOLEAN DEFAULT true
email_verified    BOOLEAN DEFAULT false
is_temporary      BOOLEAN DEFAULT false
password_used     BOOLEAN DEFAULT false
temporary_password TEXT
suspended_at      TIMESTAMPTZ
last_login_at     TIMESTAMPTZ
expires_at        TIMESTAMPTZ
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

**Trigger:** `on_auth_user_created` → Creates profile automatically on OAuth signup

**Roles:**
- `owner`: Full control of organization
- `admin`: Can manage users & settings
- `member`: Can only create deliveries

---

### 3. **deliveries**
Secure file delivery records.

```
id                    UUID PK
sender_id             UUID FK → profiles
organization_id       UUID FK → organizations
title                 TEXT NOT NULL
message               TEXT
recipient_email       TEXT NOT NULL
password_hash         TEXT
require_authentication BOOLEAN DEFAULT false

-- Limits & Tracking
expires_at            TIMESTAMPTZ NOT NULL
current_views         INT DEFAULT 0
max_views             INT NOT NULL
current_downloads     INT DEFAULT 0
max_downloads         INT NOT NULL

-- Status
status                TEXT ('active' | 'expired' | 'revoked')
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

**State Machine:**
```
active → expired   (time/limits reached)
active → revoked   (manual cancellation)
```

---

### 4. **delivery_files**
Files attached to deliveries (stored in AWS S3).

```
id             UUID PK
delivery_id    UUID FK → deliveries
filename       TEXT          -- S3 filename
original_name  TEXT          -- User's original filename
mime_type      TEXT
size           BIGINT        -- Bytes
storage_path   TEXT          -- S3 path
hash           TEXT          -- SHA-256
created_at     TIMESTAMPTZ
```

**Storage:** AWS S3 bucket `safe-docs-testing`

---

### 5. **access_logs**
Complete audit trail (immutable).

```
id           UUID PK
delivery_id  UUID FK → deliveries
action       TEXT NOT NULL
ip_address   TEXT
user_agent   TEXT
success      BOOLEAN DEFAULT true
metadata     JSONB
timestamp    TIMESTAMPTZ DEFAULT NOW()
```

**Actions:**
- `view` - Page viewed
- `download` - File downloaded
- `access_attempt` - Login attempt
- `code_verified` - 2FA code OK
- `code_requested` - 2FA code sent
- `expired` - Delivery expired
- `revoked` - Delivery cancelled

**Metadata Example:**
```json
{
  "viewer_type": "recipient",
  "file_id": "uuid",
  "location": "Santiago, Chile"
}
```

---

## 🔐 Security & Auth Tables

### 6. **delivery_access_codes**
6-digit verification codes (2FA).

```
id              UUID PK
delivery_id     UUID FK → deliveries
code            VARCHAR(6) NOT NULL
recipient_email TEXT NOT NULL
expires_at      TIMESTAMPTZ NOT NULL
attempts        INT DEFAULT 0
max_attempts    INT DEFAULT 3
verified_at     TIMESTAMPTZ
created_at      TIMESTAMPTZ
```

**Flow:**
1. User requests access → code generated
2. Email sent with 6-digit code
3. User enters code → verified_at set
4. After max_attempts → blocked

---

### 7. **invitations**
Token-based org invitations.

```
id              UUID PK
organization_id UUID FK → organizations
email           TEXT NOT NULL
role            TEXT ('owner' | 'admin' | 'member')
invited_by      UUID FK → profiles
token           TEXT UNIQUE NOT NULL
status          TEXT ('pending' | 'accepted' | 'expired' | 'cancelled')
expires_at      TIMESTAMPTZ NOT NULL
accepted_at     TIMESTAMPTZ
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
metadata        JSONB
```

**Function:** `accept_invitation(token)` → Assigns user to org

---

### 8. **organization_invitations** ⭐ NEW
SSO auto-assignment invitations (no token needed).

```
id              UUID PK
organization_id UUID FK → organizations
email           TEXT NOT NULL
full_name       TEXT
role            TEXT ('admin' | 'member')
invited_by      UUID FK → auth.users
is_accepted     BOOLEAN DEFAULT false
invited_at      TIMESTAMPTZ DEFAULT NOW()
accepted_at     TIMESTAMPTZ
expires_at      TIMESTAMPTZ

UNIQUE(organization_id, email)
```

**Trigger:** `on_invited_user_signup` → Auto-assigns when user signs up via SSO

**Difference from `invitations`:**
- Simpler (no token)
- Auto-triggered on SSO login
- Used for Google OAuth flow

---

## 📊 Compliance & Audit Tables

### 9. **ComplianceCheck**
AI-powered compliance scan results.

```
id                TEXT PK
deliveryId        UUID FK → deliveries
riskLevel         TEXT ('low' | 'medium' | 'high' | 'critical')
containsPII       BOOLEAN
containsPHI       BOOLEAN
containsFinancial BOOLEAN
detectedTypes     TEXT[]
confidence        DOUBLE
scanProvider      TEXT ('gemini' | 'openai' | 'claude')
scanDuration      INT (milliseconds)
metadata          JSONB
blockedReason     TEXT
createdAt         TIMESTAMPTZ
```

**Providers:**
- `gemini` - Google Gemini (free tier)
- `openai` - OpenAI GPT-4
- `claude` - Anthropic Claude

---

### 10. **compliance_reports**
PDF compliance reports.

```
id               UUID PK
report_type      TEXT
generated_at     TIMESTAMPTZ
period_from      TIMESTAMPTZ
period_to        TIMESTAMPTZ
total_documents  INT
compliant_docs   INT
violations       INT
risk_score       DOUBLE
report_data      JSONB
digital_signature TEXT
certificate_hash VARCHAR(64)
metadata         JSONB
```

**Generated by:** `/api/audit/generate-compliance-report`

---

### 11. **security_alerts**
Real-time security alerts.

```
id               UUID PK
delivery_id      UUID FK → deliveries
type             TEXT
severity         TEXT ('low' | 'medium' | 'high' | 'critical')
title            TEXT
description      TEXT
metadata         JSONB
status           TEXT DEFAULT 'open'
resolved_at      TIMESTAMPTZ
resolved_by      UUID FK → profiles
resolution_notes TEXT
created_at       TIMESTAMPTZ
```

**Alert Types:**
- `multiple_failed_attempts`
- `unusual_location`
- `suspicious_ip`
- `tamper_detected`
- `compliance_violation`

---

## 🔒 Advanced Security Tables

### 12. **digital_signatures**
PKI digital signatures for deliveries.

```
id             UUID PK
delivery_id    UUID FK → deliveries
signature      TEXT
algorithm      TEXT DEFAULT 'RSA-SHA256'
public_key_id  UUID FK → cryptographic_keys
signed_data    JSONB
signed_at      TIMESTAMPTZ
valid_until    TIMESTAMPTZ
is_valid       BOOLEAN DEFAULT true
revoked_at     TIMESTAMPTZ
metadata       JSONB
```

---

### 13. **document_hashes**
File integrity verification.

```
id               UUID PK
document_id      UUID
delivery_id      UUID FK → deliveries
original_filename TEXT
hash             VARCHAR(64) (SHA-256)
algorithm        TEXT DEFAULT 'SHA-256'
file_size        BIGINT
mime_type        TEXT
hashed_at        TIMESTAMPTZ
updated_at       TIMESTAMPTZ
tamper_detected  BOOLEAN DEFAULT false
last_verified_at TIMESTAMPTZ
metadata         JSONB
```

---

### 14. **custody_chain**
Blockchain-style chain of custody.

```
id            UUID PK
document_id   UUID FK → document_hashes
action        TEXT
actor_id      UUID FK → profiles
actor_email   TEXT
ip_address    TEXT
user_agent    TEXT
hash          VARCHAR(64) (current block hash)
previous_hash VARCHAR(64) (links to previous block)
signature     TEXT
metadata      JSONB
timestamp     TIMESTAMPTZ
```

**Each action creates immutable block in the chain.**

---

### 15. **cryptographic_keys**
PKI key management.

```
id          UUID PK
key_id      TEXT
algorithm   TEXT DEFAULT 'RSA-2048'
public_key  TEXT
private_key TEXT (encrypted)
purpose     TEXT
status      TEXT DEFAULT 'active'
created_at  TIMESTAMPTZ
expires_at  TIMESTAMPTZ
revoked_at  TIMESTAMPTZ
metadata    JSONB
```

---

## ⚙️ Configuration Tables

### 16. **delivery_templates**
Reusable delivery configurations.

```
id                    UUID PK
organization_id       UUID FK → organizations
name                  TEXT
description           TEXT
expires_in_hours      INT
max_views             INT
max_downloads         INT
message               TEXT
require_authentication BOOLEAN DEFAULT false
password_enabled      BOOLEAN DEFAULT false
is_default            BOOLEAN DEFAULT false
created_by            UUID FK → profiles
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

---

### 17. **subscriptions**
Billing plans & limits.

```
id                       UUID PK
organization_id          UUID FK → organizations
plan                     TEXT DEFAULT 'free'
status                   TEXT DEFAULT 'trialing'
max_deliveries_per_month INT DEFAULT 10
max_storage_gb           INT DEFAULT 1
max_users                INT DEFAULT 3
max_file_size            INT DEFAULT 10 (MB)
ai_compliance_enabled    BOOLEAN DEFAULT false
deliveries_this_month    INT DEFAULT 0
storage_used_gb          DOUBLE DEFAULT 0
last_reset_at            TIMESTAMPTZ
trial_ends_at            TIMESTAMPTZ
current_period_start     TIMESTAMPTZ
current_period_end       TIMESTAMPTZ
canceled_at              TIMESTAMPTZ
created_at               TIMESTAMPTZ
updated_at               TIMESTAMPTZ
```

**Plans:**
- `free` - 10 deliveries/mo, 1GB, 3 users
- `pro` - 100 deliveries/mo, 10GB, 10 users
- `enterprise` - Unlimited

---

## 🗺️ Simplified ER Diagram

```
┌──────────────┐
│organizations │
└──────┬───────┘
       │
       ├─1:N─→ profiles
       ├─1:N─→ deliveries
       ├─1:N─→ invitations
       ├─1:N─→ organization_invitations  ⭐
       ├─1:1─→ subscriptions
       └─1:N─→ delivery_templates

┌────────┐
│profiles│
└───┬────┘
    └─1:N─→ deliveries (as sender)

┌───────────┐
│deliveries │
└─────┬─────┘
      ├─1:N─→ delivery_files
      ├─1:N─→ access_logs
      ├─1:N─→ delivery_access_codes
      ├─1:N─→ ComplianceCheck
      ├─1:N─→ security_alerts
      ├─1:N─→ digital_signatures
      └─1:N─→ document_hashes
                   └─1:N─→ custody_chain
```

---

## 🔄 Key Triggers & Functions

### Triggers
| Trigger | Table | Function | Purpose |
|---------|-------|----------|---------|
| `on_auth_user_created` | `auth.users` | `handle_new_user()` | Auto-create profile on OAuth signup |
| `on_invited_user_signup` | `profiles` | `handle_invited_user_signup()` | Auto-assign SSO invited users |

### Functions
| Function | Purpose |
|----------|---------|
| `accept_invitation(token)` | Accept token-based invitation |
| `handle_new_user()` | Create profile for OAuth user |
| `handle_invited_user_signup()` | Auto-assign invited SSO user |

---

## 📊 Table Sizes & Growth

**High Growth:**
- `access_logs` - Grows with every action (millions of rows)
- `delivery_files` - One per uploaded file
- `deliveries` - Core business data

**Medium Growth:**
- `profiles` - One per user
- `ComplianceCheck` - One per AI scan
- `document_hashes` - One per file

**Low Growth:**
- `organizations` - One per company
- `invitations` - Temporary, cleaned up
- `subscriptions` - One per org

---

## 🎯 Access Patterns

### Most Frequent Queries

1. **Get delivery with files:**
```sql
SELECT d.*, f.*
FROM deliveries d
LEFT JOIN delivery_files f ON f.delivery_id = d.id
WHERE d.id = $1
```

2. **Get org deliveries:**
```sql
SELECT * FROM deliveries
WHERE organization_id = $1
ORDER BY created_at DESC
```

3. **Get access logs for delivery:**
```sql
SELECT * FROM access_logs
WHERE delivery_id = $1
ORDER BY timestamp DESC
```

4. **Check compliance metrics:**
```sql
SELECT COUNT(*) as total,
       SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful
FROM access_logs
WHERE delivery_id IN (
  SELECT id FROM deliveries WHERE organization_id = $1
)
```

---

## 🔮 Missing Tables (To Implement)

Based on `organization_settings` references:
- `organization_settings` - Centralized org config ⚠️ **Not yet created**
- `email_whitelist` - Allowed email addresses
- `email_blacklist` - Blocked email addresses
- `ip_whitelist` - Allowed IP addresses
- `ip_blacklist` - Blocked IP addresses

---

## 📝 Notes

- **Storage**: Files in AWS S3 (`safe-docs-testing` bucket)
- **Auth**: Supabase Auth with Google OAuth
- **RLS**: Row Level Security enabled on all tables
- **Audit**: Immutable `access_logs` for compliance
- **Encryption**: Files encrypted at rest in S3
- **Hashing**: SHA-256 for file integrity

---

**Generated**: November 2024
**Last Verified**: Live database dump
**Project**: secure-files-sender (Supabase)
