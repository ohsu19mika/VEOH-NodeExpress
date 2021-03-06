const express = require('express');
const PORT = process.env.PORT || 8080;
const body_parser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const user_model = require('./models/user-model');
const note_model = require('./models/note-model');

let app = express();

app.use(body_parser.urlencoded({
    extended: true
}));

app.use(session({
    secret: '1234qwerty',
    resave: true,
    saveUninitialized: true,
    cookie:{
        maxAge: 1000000
    }
}));

let users = [];

const is_logged_handler = (req, res, next) => {
    if(!req.session.user){
        return res.redirect('/login');
    }
    next();
};

app.use((req, res, next) => {
    console.log(`PATH: ${req.path}`);
    next();
});

app.use((req,res,next) => {
    if(!req.session.user){
        return next();
    }
    user_model.findById(req.session.user._id).then((user) => {
        req.user = user;
        next();
    });
});

app.get('/', is_logged_handler, (req,res,next)=>{
    const user = req.user;
    user.populate('notes').execPopulate().then(()=>{
        res.write(`
        <html>
        <head><title>MemoApp</title>
            <meta http-equiv="Content-Type", content="text/html;charset=UTF-8">
        </head>
        <body>
            Logged in as user: ${user.name}
            <form action="/logout" method="POST">
                <button type="submit">Log out</button>
            </form>
            <form action="/add-note" method="POST">
                <input type="text" name="note">
                <button type="submit">Add note</button>
            </form>`);
        user.notes.forEach((note) => {
            res.write(`
            <div>${note.text}
            <form action="/delete-note" method="POST">
                <input type="hidden" name="note_id", value="${note._id}">
                <button type="submit" class="delete_button">Delete note</button>
            </form>
            </div>`);
        });
        res.write(`
        </body>
        </html>
        `);
        res.end();
    });

})
app.post('/add-note', (req,res,next) => {
    if(!req.body.note){
        return res.redirect('/');
    }
    let new_note = note_model({
        text: req.body.note
    });
    new_note.save().then( () => {
        req.user.notes.push(new_note);
        req.user.save().then(()=>{
            console.log('note saved');
            return res.redirect('/');
        });
    });
});

app.post('/delete-note', (req,res,next) => {
    const user = req.user;
    const note_id_to_delete = req.body.note_id;

    //remove note from user.notes
    const updated_notes = user.notes.filter((note_id)=>{
        return note_id != note_id_to_delete;
    });
    user.notes = updated_notes;
    user.save().then(()=>{
        //Delete note object form database
        note_model.findByIdAndRemove(note_id_to_delete).then(()=>{
            res.redirect('/');
        });
    });
});

app.get('/note/:id', (req,res,next)=>{
    const note_id = req.params.id;
    note_model.findById({
        _id: note_id
    }).then((note)=>{
        res.send(note.text);
    });

});

app.post('/logout', (req,res,next) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/login', (req,res,next) => {
    console.log('user:',req.session.user);
    res.write(`
    <html>
    <head><title>MemoApp</title>
        <meta http-equiv="Content-Type", content="text/html;charset=UTF-8">
    </head>
    <body>
        <form action="/login" method="POST">
            <input type="text" name="user_name">
            <button type="submit">Log in</button>
        </form>
        <form action="/register" method="POST">
            <input type="text" name="user_name">
            <button type="submit">Register</button>
        </form>
    </body>
    </html>
    `);
    res.end();
});

app.post('/login', (req,res,next) => {
    const user_name = req.body.user_name;
    
    user_model.findOne({
        name: user_name
    }).then((user) => {
        if(user){
            req.session.user = user;;
            return res.redirect('/'); 
        }
    
    console.log('User name not registered', user_name);
    res.redirect('/login');
    });
});

app.post('/register', (req,res,next) => {
    const user_name = req.body.user_name;
    if(!user_name){
        return res.redirect('/login');
    }
    user_model.findOne({
        name: user_name
    }).then((user) => {
        if(user){
            console.log('User name already registered');
           return res.redirect('/login'); 
        }

        let new_user = new user_model({
            name: user_name,
            notes: []
        });

        new_user.save().then(()=>{
            return res.redirect('/login'); 
        });
    });
});

app.use((req, res, next) => {
    console.log('404');
    res.status(404);
    res.send('page not found')
});

const mongoose_url = 'mongodb+srv://dp-user:vTmcb7I7JtAJTyh7@cluster0-84u4u.mongodb.net/test?retryWrites=true&w=majority';
mongoose.connect(mongoose_url, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(()=>{
    console.log('Mongoose connected');
    console.log('Start express server');
    app.listen(PORT);
});

