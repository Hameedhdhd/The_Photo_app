# Coding Standards

> Follow these when writing or editing any code in this project.

## React Native / JavaScript

### Component Structure
```js
// 1. Imports
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../../../supabase'; // always use this path

// 2. Component
export default function MyScreen({ navigation, route }) {
  // state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // effects
  useEffect(() => { fetchData(); }, []);

  // handlers (async/await only)
  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from('items').select('*');
      if (error) throw error;
      setData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // render
  return <View style={styles.container}><Text>{data}</Text></View>;
}

// 3. Styles — always at the bottom
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
```

### Rules
- `async/await` everywhere — no `.then()/.catch()` chains
- Always destructure `{ data, error }` from Supabase calls
- Always check `if (error) throw error` after Supabase queries
- Use `try/catch/finally` — always reset loading state in `finally`
- Never use inline styles — always use `StyleSheet.create()`
- Screen filenames: `PascalCase` + `Screen.js` suffix (e.g. `ChatDetailScreen.js`)
- Component filenames: `PascalCase.js` (e.g. `ListingCard.js`)

## Python (Backend)

### Rules
- Use `async def` for all FastAPI route handlers
- Always use environment variables for secrets (`os.getenv()`)
- Add docstrings to all functions
- Return structured JSON responses with consistent shape: `{ "success": bool, "data": ..., "error": ... }`
- Handle all exceptions — never let a route crash without a 500 response

## Supabase / SQL

### Rules
- Every new table needs: `id`, `created_at`, `user_id` (FK to auth.users)
- Every new table needs RLS enabled + at least SELECT/INSERT policies
- Use `upsert` for items that may already exist (avoid duplicate key errors)
- Migrations go in `supabase/` folder with descriptive names

## Git / Version Control
- Commit messages: `type: short description` (e.g. `feat: add chat photo sharing`)
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`
- Never commit `.env` files
