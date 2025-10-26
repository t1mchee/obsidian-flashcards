---
tags:
  - React
  - JavaScript
  - Programming
---

# React Hooks

React Hooks are functions that let you use state and other React features in functional components.

## useState Hook

The `useState` hook allows you to add state to functional components.

```javascript
const [count, setCount] = useState(0);
```

## useEffect Hook

The `useEffect` hook lets you perform side effects in functional components.

```javascript
useEffect(() => {
  // Side effect logic here
}, [dependency]);
```

## Custom Hooks

You can create your own hooks by extracting component logic into reusable functions.

## Rules of Hooks

1. Only call hooks at the top level
2. Only call hooks from React functions
3. Don't call hooks inside loops, conditions, or nested functions
