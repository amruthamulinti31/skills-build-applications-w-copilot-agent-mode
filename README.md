# Build Applications with GitHub Copilot Agent Mode

<img src="https://octodex.github.com/images/Professortocat_v2.png" align="right" height="200px" />

Hey amruthamulinti31!

Mona here. I'm done preparing your exercise. Hope you enjoy! 💚

Remember, it's self-paced so feel free to take a break! ☕️

[![](https://img.shields.io/badge/Go%20to%20Exercise-%E2%86%92-1f883d?style=for-the-badge&logo=github&labelColor=197935)](https://github.com/amruthamulinti31/skills-build-applications-w-copilot-agent-mode/issues/1)

## OctoFit Tracker

The application lives in `octofit-tracker/` and uses React 19/Vite, Express/
TypeScript, and MongoDB/Mongoose.

Start MongoDB, then seed and run the API:

```bash
npm install --prefix octofit-tracker/backend
npm run seed --prefix octofit-tracker/backend
npm run dev --prefix octofit-tracker/backend
```

Run the presentation tier in a second terminal:

```bash
npm install --prefix octofit-tracker/frontend
npm run dev --prefix octofit-tracker/frontend -- --host 0.0.0.0
```

The API is available on port `8000` and the frontend on port `5173`. In
Codespaces, copy `frontend/.env.example` to `.env.local` and set
`VITE_CODESPACE_NAME`; local development safely falls back to
`http://localhost:8000`.

