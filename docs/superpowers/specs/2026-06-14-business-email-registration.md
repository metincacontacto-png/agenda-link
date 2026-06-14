# Design Specification: Business Email Registration

Add an email address field to the business registration onboarding form and database schema, allowing each business to be linked to an email address (which is used in Google login simulation).

## 1. Goal & Requirements
- **Goal:** Link each registered business with an owner's email address by adding an "email" field in the onboarding flow.
- **Form Placement:** Add the "Correo Electrónico" (Email Address) field to Step 1 of the onboarding wizard in the home page.
- **Database Schema:** Add a non-nullable `email` string column (with a default of empty string `""` for compatibility) to the `Business` table in `prisma/schema.prisma`.
- **API Support:** Update `/api/onboarding` to parse, validate, and persist the `email` field when creating the business.

## 2. Schema Changes
In `prisma/schema.prisma`:
```prisma
model Business {
  ...
  ownerName               String
  email                   String         @default("")
  category                String
  ...
}
```

## 3. Onboarding API Changes
In `src/app/api/onboarding/route.ts`:
- Read `email` from the request body JSON payload.
- Validate that `email` is present.
- Create the business with `email: email.trim().toLowerCase()`.

## 4. UI Changes
In `src/app/page.tsx`:
- Add `email: ""` to the initial `formData` state.
- In Step 1 form layout, add a new `formGroup` for "Correo Electrónico":
  ```tsx
  <div className={styles.formGroup}>
    <label className={styles.label}>Correo Electrónico</label>
    <input
      type="email"
      name="email"
      value={formData.email}
      onChange={handleChange}
      placeholder="Ej. juan.perez@correo.com"
      className={styles.input}
      required
    />
  </div>
  ```
- Update the submit triggers and next-step conditions to check for the presence of `formData.email`.

## 5. Verification Plan
- **Database Update:** Run `npx prisma db push` to apply schema updates.
- **TypeScript & Build:** Verify compilation using `npm run build`.
- **Manual Verification:** Register a new business through the onboarding form, entering an email. Verify that it completes successfully and links correctly in the database.
