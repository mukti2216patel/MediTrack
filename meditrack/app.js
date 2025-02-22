var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const jwt = require('jsonwebtoken');  // Import JWT
const HospitalModel = require("./routes/users");  // Assuming you have a model for hospitals

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// Secret key for JWT
const JWT_SECRET = "your_secret_key"; // Change this to a secure key in production

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware for cookie parsing
app.use(cookieParser());  // Parse cookies, needed for JWT cookie handling

// Logging middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files (e.g., images, stylesheets, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// JWT-based authentication middleware (for protected routes)
function isLoggedIn(req, res, next) {
  const token = req.cookies.token; // Get the token from cookies

  if (!token) {
    return res.status(401).send("Access Denied");
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;  // Attach decoded user info to the request
    next();
  } catch (err) {
    res.status(400).send("Invalid Token");
  }
}

// Use the routers (index and users)
app.use('/', indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
