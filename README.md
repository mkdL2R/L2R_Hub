# Left2Right Edu Org

Create a multi-step onboarding application connected to Supabase.

The system has two separate flows:

 Parent Journey (family ecosystem form)

 Student Journey (learning profile form)

Use existing Supabase tables:

 families

 parents

 students

 parent_responses

 student_responses

 ecosystem_profiles

 onboarding_status

Requirements:

 Do NOT simplify structure

 Keep Parent and Student journeys fully separate

 Each form must save directly into Supabase tables

 Add onboarding progress tracking using onboarding_status

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://left2rightcompass.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f390280d-7a73-4866-93b0-3ea58b132bd4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
