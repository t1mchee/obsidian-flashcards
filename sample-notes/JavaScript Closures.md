# JavaScript Closures

A closure is the combination of a function and the lexical environment within which that function was declared.

## Definition

A closure gives you access to an outer function's scope from an inner function. In JavaScript, closures are created every time a function is created.

## Example

```javascript
function outerFunction(x) {
  // Outer function's variable
  var outerVariable = x;
  
  // Inner function
  function innerFunction(y) {
    console.log(outerVariable + y);
  }
  
  return innerFunction;
}

var closure = outerFunction(10);
closure(5); // Outputs: 15
```

## Key Concepts

1. **Lexical Scoping**: Inner functions have access to outer function variables
2. **Data Privacy**: Closures can create private variables
3. **Function Factories**: Closures can be used to create specialized functions

## Common Use Cases

- **Module Pattern**: Creating private methods and variables
- **Event Handlers**: Maintaining state in event callbacks
- **Callbacks**: Passing functions with preserved context
- **Currying**: Transforming functions with multiple arguments
