# FinTech Standards Reference

## ISO 4217 Currency Codes (Common)
- **USD**: US Dollar
- **EUR**: Euro
- **GBP**: British Pound
- **JPY**: Japanese Yen
- **CHF**: Swiss Franc

## ISO 8601 Date Format
- **Format**: `YYYY-MM-DDTHH:mm:ss.sssZ`
- **Example**: `2026-05-10T14:30:00.000Z`

## Account Format
- **Pattern**: `/^ACC-[A-Z0-9]{5}$/`
- **Valid**: `ACC-12345`, `ACC-ABCDE`
- **Invalid**: `ACC-123`, `12345-ACC`, `ACC-123456`
