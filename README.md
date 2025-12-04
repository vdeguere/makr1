# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/2baecf86-c0c8-439c-8312-43a013b11455

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2baecf86-c0c8-439c-8312-43a013b11455) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up environment variables (see Environment Setup below)

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Environment Setup

This project requires environment variables to connect to Supabase. Follow these steps:

1. **Copy the example environment file:**
   ```sh
   cp .env.example .env
   ```

2. **Get your Supabase credentials:**
   - Go to your [Supabase project settings](https://app.supabase.com/project/xizvezmghzgxgeliuiym/settings/api)
   - Find the "Project URL" and "anon/public" key
   - Copy the "anon" or "public" key (this is your `VITE_SUPABASE_PUBLISHABLE_KEY`)

3. **Update `.env` file:**
   - Open the `.env` file in the project root
   - Replace `your_supabase_anon_key_here` with your actual Supabase anon/public key
   - The other values are already configured correctly

4. **Restart the dev server** after updating `.env`:
   ```sh
   npm run dev
   ```

The development server will run on `http://localhost:8080` (or the next available port if 8080 is in use).

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2baecf86-c0c8-439c-8312-43a013b11455) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
