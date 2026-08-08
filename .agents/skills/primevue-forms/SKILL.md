---
name: primevue-forms
description: Use when building forms with PrimeVue Forms and Yup validation. Covers Form, FormField, yupResolver, validation patterns, error display, and Apollo-inspired styling.
---

# PrimeVue Forms + Yup Validation Patterns

## Imports

```typescript
import { Form, FormField } from '@primevue/forms';
import { yupResolver } from '@primevue/forms/resolvers/yup';
import { object, string, number, boolean, array, ref as yupRef } from 'yup';
```

No separate resolver package needed - `yupResolver` is built into `@primevue/forms/resolvers/yup`.

## Form Component API

### Props
- `:initialValues` - Object with initial field values
- `:resolver` - Validation resolver (yupResolver)

### Events
- `@submit` - Fires on form submit, receives `{ valid: boolean, values: object, errors: object, states: object }`

### Slot Props (`v-slot="$form"`)
- `$form.<fieldName>?.invalid` - Boolean, field is invalid
- `$form.<fieldName>?.error?.message` - Validation error message
- `$form.<fieldName>?.valid` - Boolean, field is valid
- `$form.valid` - Boolean, entire form is valid

## Standard Form Pattern

```vue
<script setup lang="ts">
import { yupResolver } from '@primevue/forms/resolvers/yup';
import { object, string } from 'yup';

interface LoginForm {
  email: string;
  password: string;
}

const resolver = yupResolver(object({
  email: string().required('Email is required').email('Must be a valid email'),
  password: string().required('Password is required').min(6, 'Minimum 6 characters'),
}));

const initialValues: LoginForm = { email: '', password: '' };

const loading = shallowRef(false);
const serverError = shallowRef('');

async function onSubmit({ valid, values }: { valid: boolean; values: LoginForm }) {
  if (!valid) return;
  loading.value = true;
  serverError.value = '';
  try {
    // API call here
  } catch (e) {
    serverError.value = e instanceof Error ? e.message : 'Request failed';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Form
    v-slot="$form"
    :initialValues="initialValues"
    :resolver="resolver"
    @submit="onSubmit"
    class="auth-form"
  >
    <Message v-if="serverError" severity="error" :closable="false" variant="simple">
      {{ serverError }}
    </Message>

    <div class="form-field">
      <label for="email">Email</label>
      <InputText id="email" name="email" type="email" placeholder="Enter your email" fluid />
      <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
        {{ $form.email.error?.message }}
      </Message>
    </div>

    <div class="form-field">
      <label for="password">Password</label>
      <Password id="password" name="password" placeholder="Enter your password" :feedback="false" toggle-mask fluid />
      <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
        {{ $form.password.error?.message }}
      </Message>
    </div>

    <Button type="submit" label="Sign In" :loading="loading" fluid />
  </Form>
</template>
```

## Key Rule: `name` prop replaces `v-model`

Inside a `<Form>`, PrimeVue components use the `name` prop (matching schema keys) instead of `v-model`. The Form manages state internally.

## Common Yup Schemas

```typescript
// Required string
string().required('Field is required')

// Email
string().required('Email is required').email('Invalid email')

// Password with min length
string().required('Password is required').min(8, 'Min 8 characters')

// Password confirmation (must match another field)
string().required('Confirm your password').oneOf([yupRef('password')], 'Passwords must match')

// Optional number
number().nullable().positive('Must be positive')

// Enum / one of values
string().required().oneOf(['active', 'inactive'], 'Invalid status')
```

## Error Display Pattern

Always use PrimeVue `Message` with `severity="error"`, `size="small"`, `variant="simple"` for inline field errors:

```vue
<Message v-if="$form.fieldName?.invalid" severity="error" size="small" variant="simple">
  {{ $form.fieldName.error?.message }}
</Message>
```

For server-level errors (API failures), use a full `Message` above the form fields:

```vue
<Message v-if="serverError" severity="error" :closable="false">
  {{ serverError }}
</Message>
```

## Apollo-Inspired Auth Form Styling

Design cues from PrimeVue Apollo theme for auth pages:

### Layout
- Full viewport height, centered card
- Clean white card on subtle gray background (#F8FAFC)
- Card max-width: 420px, rounded corners (12px), soft shadow
- Indigo (#4F46E5) accent on top border (3px)

### Form Fields
- Vertical stack with gap (1.5rem between fields)
- Labels above inputs, font-weight 600, text color #334155
- Inputs use PrimeVue `fluid` prop for full width
- Small gap (0.25rem) between label and input

### Buttons
- Primary button full-width (`fluid`), indigo background
- Loading state with spinner via `:loading` prop

### Cards (Dashboard)
- Background: white (#FFFFFF)
- Border: 1px solid var(--p-surface-200)
- Border-radius: 12px
- Padding: 1.5rem
- Shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
- Header section with title (font-weight 600) and optional subtitle

### CSS Variables (PrimeVue Aura theme)
- `var(--p-surface-0)` - white
- `var(--p-surface-50)` - lightest gray bg
- `var(--p-surface-100)` - hover bg
- `var(--p-surface-200)` - borders
- `var(--p-primary-color)` - indigo
- `var(--p-text-color)` - main text
- `var(--p-text-muted-color)` - secondary text
