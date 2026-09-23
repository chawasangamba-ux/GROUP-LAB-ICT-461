
// ==========================================
// ICT461 COURSE REGISTRATION API
// ==========================================

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");

const app = express();

const PORT = 3000;

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS configuration
// The frontend is running on port 5500
// and the API is running on port 3000.
app.use(
    cors({
        origin: "http://localhost:5500",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type"]
    })
);

// Parse JSON request bodies
app.use(express.json());

// Parse form-urlencoded request bodies
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());


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


// Check whether the selected course exists
function isValidCourse(courseCode) {
    return courses.some(course => course.code === courseCode);
}


// Check whether the selected programme exists
function isValidProgramme(programme) {
    const validProgrammes = [
        "Computer Science",
        "Information Technology",
        "Information Systems",
        "Cyber Security"
    ];

    return validProgrammes.includes(programme);
}


// Validate a complete registration
function validateRegistration(data) {

    const errors = [];

    // Make sure a request body exists
    if (!data || typeof data !== "object") {
        errors.push("Request body is required.");
        return errors;
    }

    // Validate student name
    if (!isValidString(data.studentName)) {
        errors.push("studentName is required.");
    }

    // Validate student ID
    if (!isValidString(data.studentId)) {
        errors.push("studentId is required.");
    }

    // Validate programme
    if (!isValidString(data.programme)) {

        errors.push("programme is required.");

    } else if (!isValidProgramme(data.programme)) {

        errors.push("Invalid programme.");
    }

    // Validate course
    if (!isValidString(data.course)) {

        errors.push("course is required.");

    } else if (!isValidCourse(data.course)) {

        errors.push("Invalid course.");
    }

    return errors;
}


// ==========================================
// DUPLICATE CHECK
// ==========================================

function isDuplicate(studentId, course, ignoreId = null) {

    return registrations.some(registration => {

        return (
            registration.studentId.toLowerCase() ===
            studentId.toLowerCase() &&
            registration.course === course &&
            registration.id !== ignoreId
        );

    });
}


// ==========================================
// GET /api/courses
// TASK 3 - ETAG AND CACHING
// ==========================================

app.get("/api/courses", (req, res) => {

    // Convert the course data to a string
    const courseData = JSON.stringify(courses);

    // Generate an ETag based on the course data
    const etag = `"${crypto
        .createHash("sha256")
        .update(courseData)
        .digest("hex")}"`;

    // Allow the response to be cached for 60 seconds
    res.set("Cache-Control", "public, max-age=60");

    // Send the ETag
    res.set("ETag", etag);

    // Check whether the client already has this version
    if (req.headers["if-none-match"] === etag) {

        // Data has not changed
        // Return 304 with no response body
        return res.status(304).end();
    }

    // First request or changed data
    res.status(200).json(courses);
});


// ==========================================
// COOKIE DEMONSTRATION
// TASK 4
// ==========================================

// This is a demonstration only.
// It is NOT a login system.

app.get("/api/cookie-demo", (req, res) => {

    res.cookie("ict461_demo", "student-demo", {

        // JavaScript cannot directly read this cookie
        httpOnly: true,

        // Helps restrict cross-site cookie sending
        sameSite: "lax",

        // Cookie applies to the whole site
        path: "/"
    });

    res.status(200).json({
        message: "Demo cookie has been set."
    });
});


// ==========================================
// COOKIE CHECK ROUTE
// TASK 4
// ==========================================

// This route allows us to demonstrate that
// the browser sends the stored cookie on a
// later request.

app.get("/api/cookie-check", (req, res) => {

    res.status(200).json({

        message: "Cookie check completed.",

        receivedCookie:
            req.cookies.ict461_demo || null
    });
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

    // Registration information should not be cached
    res.set("Cache-Control", "no-store");

    res.status(200).json(registration);
});


// ==========================================
// POST /api/registrations
// ==========================================

app.post("/api/registrations", (req, res) => {

    // Registration responses must not be cached
    res.set("Cache-Control", "no-store");

    const data = req.body;

    // ------------------------------------------
    // SERVER-SIDE VALIDATION
    // ------------------------------------------

    const errors = validateRegistration(data);

    if (errors.length > 0) {

        return res.status(400).json({

            message: "Invalid registration data.",

            errors: errors
        });
    }


    // ------------------------------------------
    // DUPLICATE CHECK
    // ------------------------------------------

    if (isDuplicate(data.studentId, data.course)) {

        return res.status(409).json({

            message:
                "This student ID is already registered for this course."
        });
    }


    // ------------------------------------------
    // CREATE REGISTRATION
    // ------------------------------------------

    const registration = {

        id: nextId++,

        studentName: data.studentName.trim(),

        studentId: data.studentId.trim(),

        programme: data.programme,

        course: data.course
    };


    registrations.push(registration);


    // ------------------------------------------
    // RETURN CREATED RESOURCE
    // ------------------------------------------

    res
        .status(201)
        .location(`/api/registrations/${registration.id}`)
        .json(registration);
});


// ==========================================
// PUT /api/registrations/:id
// FULL REPLACEMENT
// ==========================================

app.put("/api/registrations/:id", (req, res) => {

    const id = Number(req.params.id);

    const registrationIndex = registrations.findIndex(
        item => item.id === id
    );


    // ------------------------------------------
    // RECORD NOT FOUND
    // ------------------------------------------

    if (registrationIndex === -1) {

        return res.status(404).json({
            message: "Registration not found."
        });
    }


    // ------------------------------------------
    // VALIDATE COMPLETE RECORD
    // ------------------------------------------

    const data = req.body;

    const errors = validateRegistration(data);

    if (errors.length > 0) {

        return res.status(400).json({

            message: "Invalid registration data.",

            errors: errors
        });
    }


    // ------------------------------------------
    // DUPLICATE CHECK
    // ------------------------------------------

    if (isDuplicate(data.studentId, data.course, id)) {

        return res.status(409).json({

            message:
                "This student ID is already registered for this course."
        });
    }


    // ------------------------------------------
    // REPLACE RECORD
    // ------------------------------------------

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
// CHANGE PROGRAMME ONLY
// ==========================================

app.patch("/api/registrations/:id", (req, res) => {

    const id = Number(req.params.id);

    const registration = registrations.find(
        item => item.id === id
    );


    // ------------------------------------------
    // RECORD NOT FOUND
    // ------------------------------------------

    if (!registration) {

        return res.status(404).json({
            message: "Registration not found."
        });
    }


    // ------------------------------------------
    // ONLY PROGRAMME CAN BE CHANGED
    // ------------------------------------------

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


    // ------------------------------------------
    // VALIDATE PROGRAMME
    // ------------------------------------------

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


    // ------------------------------------------
    // RECORD NOT FOUND
    // ------------------------------------------

    if (registrationIndex === -1) {

        return res.status(404).json({

            message: "Registration not found."
        });
    }


    // ------------------------------------------
    // DELETE REGISTRATION
    // ------------------------------------------

    registrations.splice(registrationIndex, 1);


    // 204 means successful deletion
    // and MUST NOT contain a response body.

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
