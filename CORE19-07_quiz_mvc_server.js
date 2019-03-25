const express = require('express');
const app = express();

// Import MW for parsing POST params in BODY
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

// Import MW supporting Method Override with express
const methodOverride = require('method-override');
app.use(methodOverride('_method', {methods: ["POST", "GET"]}));

// ========== MODEL ==========

const Sequelize = require('sequelize');

const options = {logging: false, operatorsAliases: false};
const sequelize = new Sequelize("sqlite:db.sqlite", options);

const Quiz = sequelize.define(  // define Quiz model (table quizzes)
    'quiz',
    {
        question: Sequelize.STRING,
        answer: Sequelize.STRING
    }
);

sequelize.sync() // Syncronize DB and seed if needed
    .then(() => Quiz.count())
    .then(count => {
        if (count === 0) {
            return Quiz.bulkCreate([
                {question: "Capital of Italy", answer: "Rome"},
                {question: "Capital of France", answer: "Paris"},
                {question: "Capital of Spain", answer: "Madrid"},
                {question: "Capital of Portugal", answer: "Lisbon"}
            ])
                .then(c => console.log(`DB filled with ${c.length} quizzes.`));
        } else {
            console.log(`DB exists & has ${count} quizzes.`);
        }
    })
    .catch(console.log);


// ========== VIEWs ==========

// CSS style to include into the views:
const style = `
        <style>
            .button { display: inline-block; text-decoration: none;
                padding: 2px 6px; margin: 2px;
                background: #4479BA; color: #FFF;
                border-radius: 4px; border: solid 1px #20538D; }
            .button:hover { background: #356094; }
        </style>`;

// View to display all the quizzes passed into the quizzes parameter.
const indexView = quizzes =>
    `<!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>P7: Quiz</title>
        ${style}
    </head>
    <body>
        <h1>Quizzes</h1>` +
    quizzes.map(quiz =>
        `<div>
                <a href="/quizzes/${quiz.id}/play">${quiz.question}</a>
                <a href="/quizzes/${quiz.id}/edit"
                   class="button">Edit</a>
                <a href="/quizzes/${quiz.id}?_method=DELETE"
                   onClick="return confirm('Delete: ${quiz.question}')"
                   class="button">Delete</a>
             </div>`).join("\n") +
    `<a href="/quizzes/new" class="button">New Quiz</a>
    </body>
    </html>`;


// View to play to the quiz passed into the quiz parameter.
// response is the response typed in by the user.
const playView = (quiz, response) =>
    `<!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>P7: Quiz</title>
        ${style}
    </head>
    <body>
        <h1>Play Quiz</h1>
        <form method="get" action="/quizzes/${quiz.id}/check">
            ${quiz.question}: <br />
            <input type="text" name="response" value="${response}"
placeholder="Answer" />
            <input type="submit" class="button" value="Check" /> <br />
        </form>
        <a href="/quizzes" class="button">Go back</a>
    </body>
    </html>`;


// View to show the result of playing a quiz.
// id is the id of the played quiz.
// msg is the obtained result.
// response is the answer typed in by the user.
const resultView = (id, msg, response) =>
    `<!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>P7: Quiz</title>
         ${style}
   </head>
    <body>
        <h1>Result</h1>
        <div id="msg"><strong>${msg}</strong></div>
        <a href="/quizzes" class="button">Go back</a>
        <a href="/quizzes/${id}/play?response=${response}" class="button">Try again</a>
    </body>
    </html>`;


// View to show a form to create a new quiz.
const newView = (quiz) => {
    return `<!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>P7: Quiz</title>
        ${style}
    </head>
    <body>
        <h1>Create New Quiz</h1>
        <form method="POST" action="/quizzes">
            Question: <input type="text" name="question" value="${quiz.question}"
placeholder="Question" /> <br />
            Answer: <input type="text" name="answer"   value="${quiz.answer}"  
placeholder="Answer" />
            <input type="submit" class="button" value="Create" /> <br />
        </form>
        <a href="/quizzes" class="button">Go back</a>
    </body>
    </html>`;
}


// View to show a form to edit the given quiz.
const editView = (quiz) => {
    // .... introducir código
}


// ========== CONTROLLERs ==========

// GET /, GET /quizzes
const indexController = (req, res, next) => {
    Quiz.findAll()
        .then(quizzes => res.send(indexView(quizzes)))
        .catch(next);
};

//  GET  /quizzes/:id/play
const playController = (req, res, next) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return next(`id "${req.params.id}" is not a number.`);

    const response = req.query.response || "";

    Quiz.findByPk(id)   // Sequelize v5 utiliza findByPk en vez de findById (esta deprecado)
        .then(quiz => quiz ?
            res.send(playView(quiz, response)) :
            next(new Error(`Quiz ${id} not found.`)))
        .catch(next);
};


//  GET  /quizzes/:id/check
const checkController = (req, res, next) => {
    const response = req.query.response;

    const id = Number(req.params.id);
    if (Number.isNaN(id)) return next(`id "${req.params.id}" is not a number.`);

    Quiz.findByPk(id)   // Sequelize v5 utiliza findByPk en vez de findById (esta deprecado)
        .then(quiz => {
            const msg = (quiz.answer.toLowerCase().trim() ===
                response.toLowerCase().trim()) ?
                `Yes, "${response}" is the ${quiz.question}`
                : `No, "${response}" is not the ${quiz.question}`;
            return res.send(resultView(id, msg, response));
        })
        .catch(next);
};


// GET /quizzes/new
const newController = (req, res, next) => {
    const quiz = {question: "", answer: ""};
    res.send(newView(quiz));
};

// POST /quizzes
const createController = (req, res, next) => {
    let {question, answer} = req.body;

    Quiz.create({question, answer})
        .then(quiz => res.redirect('/quizzes'))
        .catch(next);
};

//  GET /quizzes/:id/edit
const editController = (req, res, next) => {
    // .... introducir código
};

//  PUT /quizzes/:id
const updateController = (req, res, next) => {
    // .... introducir código
};

// DELETE /quizzes/:id
const destroyController = (req, res, next) => {
    // .... introducir código
};


// ========== ROUTES ==========

app.get(['/', '/quizzes'], indexController);
app.get('/quizzes/:id/play', playController);
app.get('/quizzes/:id/check', checkController);
app.get('/quizzes/new', newController);
app.post('/quizzes', createController);

// ..... crear rutas e instalar los MWs para:
//   GET  /quizzes/:id/edit
//   PUT  /quizzes/:id
//   DELETE  /quizzes/:id


app.all('*', (req, res) =>
    res.status(404).send("Error: resource not found or method not supported.")
);


// Middleware to manage errors:
app.use((error, req, res, next) => {
    console.log("Error:", error.message || error);
    res.redirect("/");
});

// Server started at port 8000
app.listen(8000);