// ==========================================
// ICT461 COURSE REGISTRATION API
// TASK 2 - HTTP CONTRACT
// ==========================================

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

const PORT = 3000;

const INTERFACE_ORIGINS = [
    "http://localhost:5500/frontend",
    "http://127.0.0.1:5500/frontend"
];


// ==========================================
// MIDDLEWARE
// ==========================================

// Allow requests from the frontend.
app.use(cors());

// Parse JSON request bodies.
app.use(express.json());

// Parse form-urlencoded request bodies.
// This is used for the /inspect diagnostic route.
app.use(express.urlencoded({ extended: true }));

// ==========================================
// ASSIGNED COURSES
// ==========================================

const courses = [
    {
        code: "ICT461",
        name: "Web Systems and Technology"
    },
    {
        code: "ICT411",
        name: "Cloud Computing"
    },
    {
        code: "ICS441",
        name: "Information Security"
    }
];


// ==========================================
// IN-MEMORY REGISTRATION DATA
// ==========================================

let registrations = [];

let nextId = 1;


// ==========================================
// VALIDATION HELPERS
// ==========================================

function isValidString(value) {
    return typeof value === "string" && value.trim().length > 0;
}


function isValidCourse(courseCode) {
    return courses.some(course => course.code === courseCode);
}


function isValidProgramme(programme) {

    const validProgrammes = [
        "Computer Science",
        "Information Technology",
        "Information Systems",
        "Cyber Security"
    ];

    return validProgrammes.includes(programme);
}


// Validate all required registration fields.
function validateRegistration(data) {

    const errors = [];

    if (!isValidString(data.studentName)) {
        errors.push("studentName is required.");
    }

    if (!isValidString(data.studentId)) {
        errors.push("studentId is required.");
    }

    if (!isValidString(data.programme)) {
        errors.push("programme is required.");
    } else if (!isValidProgramme(data.programme)) {
        errors.push("Invalid programme.");
    }

    if (!isValidString(data.course)) {
        errors.push("course is required.");
    } else if (!isValidCourse(data.course)) {
        errors.push("Invalid course.");
    }

    return errors;
}


// Check whether the student already has
// the same course.
function isDuplicate(studentId, course, ignoreId = null) {

    return registrations.some(registration => {

        return (
            registration.studentId.toLowerCase() === studentId.toLowerCase() &&
            registration.course === course &&
            registration.id !== ignoreId
        );

    });
}


// ==========================================
// GET /api/courses
// ==========================================

app.get("/api/courses", (req, res) => {

    res.status(200).json(courses);

});


// ==========================================
// GET /api/registrations/:id
// ==========================================

app.get("/api/registrations/:id", (req, res) => {

    const id = Number(req.params.id);

    const registration = registrations.find(
        item => item.id === id
    );


    if (!registration) {

        return res.status(404).json({
            message: "Registration not found."
        });

    }


    res.status(200).json(registration);

});


// ==========================================
// POST /api/registrations
// ==========================================

app.post("/api/registrations", (req, res) => {

    const data = req.body;


    // ------------------------------
    // SERVER-SIDE VALIDATION
    // ------------------------------

    const errors = validateRegistration(data);


    if (errors.length > 0) {

        return res.status(400).json({
            message: "Invalid registration data.",
            errors: errors
        });

    }


    // ------------------------------
    // DUPLICATE CHECK
    // ------------------------------

    if (isDuplicate(data.studentId, data.course)) {

        return res.status(409).json({
            message:
                "This student ID is already registered for this course."
        });

    }


    // ------------------------------
    // CREATE REGISTRATION
    // ------------------------------

    const registration = {

        id: nextId++,

        studentName: data.studentName.trim(),

        studentId: data.studentId.trim(),

        programme: data.programme,

        course: data.course

    };


    registrations.push(registration);


    // Location header identifies the
    // newly-created resource.
    res
        .status(201)
        .location(`/api/registrations/${registration.id}`)
        .json(registration);

});


// ==========================================
// PUT /api/registrations/:id
// ==========================================

app.put("/api/registrations/:id", (req, res) => {

    const id = Number(req.params.id);


    const registrationIndex = registrations.findIndex(
        item => item.id === id
    );


    // ------------------------------
    // RECORD NOT FOUND
    // ------------------------------

    if (registrationIndex === -1) {

        return res.status(404).json({
            message: "Registration not found."
        });

    }


    // ------------------------------
    // VALIDATE COMPLETE RECORD
    // ------------------------------

    const data = req.body;

    const errors = validateRegistration(data);


    if (errors.length > 0) {

        return res.status(400).json({
            message: "Invalid registration data.",
            errors: errors
        });

    }


    // ------------------------------
    // DUPLICATE CHECK
    // ------------------------------

    if (isDuplicate(data.studentId, data.course, id)) {

        return res.status(409).json({
            message:
                "This student ID is already registered for this course."
        });

    }


    // ------------------------------
    // REPLACE THE RECORD
    // ------------------------------

    const updatedRegistration = {

        id: id,

        studentName: data.studentName.trim(),

        studentId: data.studentId.trim(),

        programme: data.programme,

        course: data.course

    };


    registrations[registrationIndex] = updatedRegistration;


    res.status(200).json(updatedRegistration);

});


// ==========================================
// PATCH /api/registrations/:id
// ==========================================

app.patch("/api/registrations/:id", (req, res) => {

    const id = Number(req.params.id);


    const registration = registrations.find(
        item => item.id === id
    );


    // ------------------------------
    // RECORD NOT FOUND
    // ------------------------------

    if (!registration) {

        return res.status(404).json({
            message: "Registration not found."
        });

    }


    // ------------------------------
    // ONLY PROGRAMME CAN BE CHANGED
    // ------------------------------

    if (
        Object.keys(req.body).some(
            key => key !== "programme"
        )
    ) {

        return res.status(400).json({
            message:
                "PATCH only allows the programme field."
        });

    }


    const { programme } = req.body;


    // ------------------------------
    // VALIDATE PROGRAMME
    // ------------------------------

    if (!isValidProgramme(programme)) {

        return res.status(400).json({
            message: "Invalid programme."
        });

    }


    registration.programme = programme;


    res.status(200).json(registration);

});


// ==========================================
// DELETE /api/registrations/:id
// ==========================================

app.delete("/api/registrations/:id", (req, res) => {

    const id = Number(req.params.id);


    const registrationIndex = registrations.findIndex(
        item => item.id === id
    );


    // ------------------------------
    // RECORD NOT FOUND
    // ------------------------------

    if (registrationIndex === -1) {

        return res.status(404).json({
            message: "Registration not found."
        });

    }


    // Remove the registration.
    registrations.splice(registrationIndex, 1);


    // 204 means successful deletion
    // with NO response body.
    res.status(204).send();

});


// ==========================================
// /inspect DIAGNOSTIC ROUTE
// ==========================================

app.all("/inspect", (req, res) => {

    res.status(200).json({

        method: req.method,

        path: req.path,

        headers: req.headers,

        body: req.body

    });

});


// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

    console.log(
        `ICT461 API server running at http://localhost:${PORT}`
    );

});

