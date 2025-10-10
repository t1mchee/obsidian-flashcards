# Obsidian Flashcards

🎴 Anki-style spaced repetition flashcard app for your Obsidian markdown notes.
<img width="1920" height="954" alt="image" src="https://github.com/user-attachments/assets/68b2af5f-9940-41b6-95ba-13c59e7d79d9" />
<img width="1920" height="954" alt="image" src="https://github.com/user-attachments/assets/19835fc9-b22d-489d-96c2-2c8e1edfc4b4" />


## Features

### 📚 Core Functionality
- **Spaced Repetition**: SM-2 algorithm for optimal learning
- **Obsidian Integration**: Import your markdown notes directly
- **LaTeX Support**: Full MathJax rendering for mathematical equations
- **Progress Tracking**: Detailed statistics and review history
- **Card Selection**: Choose specific cards to study

### ⌨️ Keyboard Shortcuts
- **Space**: Reveal answer
- **1**: Fucked (complete blackout)
- **2**: Hard (incorrect response)
- **3**: Good (correct response)
- **4**: Piss (perfect response)

### 🎨 Design
- **Cursor Theme**: Dark mode with Cursor's color palette
- **Modern UI**: Clean, professional interface
- **Responsive**: Works on desktop and mobile

## Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Run development server:**
```bash
npm run dev
```

3. **Upload your markdown files**
4. **Start studying!**

## Markdown Format

Each markdown file becomes a flashcard:
- **Title** (# heading) → Front of card
- **Content** → Back of card

### Supported Markdown Features
- Headers (`#`, `##`, `###`)
- **Bold** and *italic* text
- Bulleted lists (`-` or `*`)
- Inline math: `$E = mc^2$`
- Display math: `$$\int_0^\infty e^{-x^2} dx$$`
- LaTeX environments: `\begin{align}...\end{align}`

### Example Note

```markdown
# Pythagorean Theorem

The Pythagorean theorem states:

$$a^2 + b^2 = c^2$$

Where:
- $a$ and $b$ are the legs of a right triangle
- $c$ is the hypotenuse
```

## Features in Detail

### Card Management
- **Add Cards**: Upload new markdown files anytime
- **Duplicate Detection**: Automatically skips duplicate titles
- **Search & Filter**: Find cards by title, content, or status
- **Bulk Selection**: Select multiple cards to study

### Review Modes
- **Due Cards**: Review cards that are due today
- **New Cards**: Learn cards you haven't seen yet
- **All Cards**: Review your entire deck
- **Custom Selection**: Choose specific cards

### Statistics
- Total cards in your collection
- Cards due for review
- New cards to learn
- Today's review count and accuracy

### Data Management
- **Export**: Save your progress as JSON
- **Import**: Restore from backup
- **Reset**: Clear all progress
- **Local Storage**: All data stored in browser

## Tech Stack

- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **MathJax 3**: LaTeX rendering (same as Obsidian)
- **Lucide React**: Icon library
- **gray-matter**: Markdown parsing
- **date-fns**: Date utilities

## Color Palette (Cursor Theme)

- Background: `#1e1e1e`
- Panels: `#2d2d2d`
- Borders: `#3e3e3e`, `#4e4e4e`
- Primary: `#007acc` (Cursor blue)
- Success: `#4ec9b0` (teal)
- Warning: `#cca700` (yellow)
- Error: `#f14c4c` (red)

## License

MIT
