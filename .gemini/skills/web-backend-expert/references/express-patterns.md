# Express.js Design Patterns

## Async Route Wrapper
Avoid `try/catch` in every route by using a wrapper:
```javascript
const catchAsync = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage
router.get('/', catchAsync(async (req, res) => {
  const data = await service.getData();
  res.status(200).json(data);
}));
```

## Global Error Handler
```javascript
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message
  });
});
```

## Middleware Template
```javascript
const myMiddleware = (req, res, next) => {
  // logic
  next();
};
```
