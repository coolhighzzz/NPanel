const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'html')));

// Session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Middleware to check if user is authenticated
const authenticate = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.redirect('/login');
  }
};

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));  // Set the views directory to 'views'

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'login.html'));
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json')));
  const authenticatedUser = usersData.find(user => user.email === email && user.password === password);

  if (authenticatedUser) {
    // Store user information in session
    req.session.user = authenticatedUser;
    res.redirect('/main');
  } else {
    res.send('<h1>Invalid email or password. Please try again.</h1>');
  }
});

app.get('/user/create', (req, res) => {
  res.send(`
    <h1>Create User</h1>
    <form action="/user/create" method="post">
      <label>Email:</label>
      <input type="text" name="email" required><br>
      <label>Password:</label>
      <input type="password" name="password" required><br>
      <label>Admin:</label>
      <input type="checkbox" name="isAdmin"><br>
      <input type="submit" value="Create User">
    </form>
  `);
});

app.post('/user/create', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const isAdmin = req.body.isAdmin;

  const role = isAdmin ? 'admin' : 'user';

  const newUser = { email, password, role };
  const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json')));
  usersData.push(newUser);
  fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(usersData));

  res.redirect('/main');
});

// Route protected by authentication middleware
app.get('/main', authenticate, (req, res) => {
  const user = req.session.user;
  res.render('main', { user });
});

// Route for the /admin route
app.get('/admin', authenticate, (req, res) => {
  // Check if the user is an admin
  if (req.session.user && req.session.user.role === 'admin') {
    res.render('admin', { user: req.session.user });
  } else {
    res.status(403).send('<h1>Access Forbidden</h1>');
  }
});

app.get('*', (req, res) => {
  res.status(404).send('<h1>404 Page Not Found</h1>');
});

app.listen(port, () => {
  console.log(`NPANEL login app is running on port ${port}`);
});
