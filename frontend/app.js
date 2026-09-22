// app.js

import { createRegistration } from "./api.js";


// ==============================
// GET DOM ELEMENTS
// ==============================

const form = document.querySelector("#registrationForm");

const studentNameInput = document.querySelector("#studentName");
const studentIdInput = document.querySelector("#studentId");
const programmeInput = document.querySelector("#programme");
const courseInput = document.querySelector("#course");

const submitButton = document.querySelector("#submitButton");
const feedback = document.querySelector("#formFeedback");

const nameError = document.querySelector("#nameError");
const studentIdError = document.querySelector("#studentIdError");
const programmeError = document.querySelector("#programmeError");
const courseError = document.querySelector("#courseError");


// ==============================
// LOCAL STORAGE
// ==============================

const savedProgramme = localStorage.getItem("programmePreference");

if (savedProgramme) {
    programmeInput.value = savedProgramme;
}


// Save only the selected programme.
// No student name, ID or course is stored.
programmeInput.addEventListener("change", () => {

    if (programmeInput.value) {
        localStorage.setItem(
            "programmePreference",
            programmeInput.value
        );
    } else {
        localStorage.removeItem("programmePreference");
    }
});


// ==============================
// CLEAR VALIDATION ERRORS
// ==============================

function clearErrors() {

    nameError.textContent = "";
    studentIdError.textContent = "";
    programmeError.textContent = "";
    courseError.textContent = "";

    studentNameInput.removeAttribute("aria-invalid");
    studentIdInput.removeAttribute("aria-invalid");
    programmeInput.removeAttribute("aria-invalid");
    courseInput.removeAttribute("aria-invalid");
}


// ==============================
// VALIDATE FORM
// ==============================

function validateForm() {

    clearErrors();

    let valid = true;

    const studentName = studentNameInput.value.trim();
    const studentId = studentIdInput.value.trim();
    const programme = programmeInput.value;
    const course = courseInput.value;


    if (!studentName) {

        nameError.textContent = "Please enter your name.";
        studentNameInput.setAttribute("aria-invalid", "true");

        valid = false;
    }


    if (!studentId) {

        studentIdError.textContent = "Please enter your student ID.";
        studentIdInput.setAttribute("aria-invalid", "true");

        valid = false;
    }


    if (!programme) {

        programmeError.textContent = "Please select your programme.";
        programmeInput.setAttribute("aria-invalid", "true");

        valid = false;
    }


    if (!course) {

        courseError.textContent = "Please select a course.";
        courseInput.setAttribute("aria-invalid", "true");

        valid = false;
    }


    return valid;
}


// ==============================
// FEEDBACK FUNCTIONS
// ==============================

function showFeedback(message, type) {

    feedback.textContent = message;

    feedback.className = "form-feedback";

    if (type) {
        feedback.classList.add(type);
    }
}


// ==============================
// FORM SUBMISSION
// ==============================

form.addEventListener("submit", async (event) => {

    // Prevent the browser from reloading the page.
    event.preventDefault();

    clearErrors();

    // Check form values.
    if (!validateForm()) {

        showFeedback(
            "Please correct the errors before submitting.",
            "error"
        );

        return;
    }


    // Collect form information.
    const registration = {
        studentName: studentNameInput.value.trim(),
        studentId: studentIdInput.value.trim(),
        programme: programmeInput.value,
        course: courseInput.value
    };


    // Loading state.
    submitButton.disabled = true;
    submitButton.textContent = "Registering...";

    showFeedback(
        "Submitting your registration...",
        "loading"
    );


    try {

        const result = await createRegistration(registration);

        // Safely update the page using textContent.
        showFeedback(
            `Registration successful.Registration ID: ${result.data.id} `,
            "success"
        );

        // Reset the form.
        // Programme will be restored from localStorage.
        form.reset();

        programmeInput.value =
            localStorage.getItem("programmePreference") || "";

    } catch (error) {

        console.error("Registration error:", error);

        showFeedback(
            `Registration failed: ${error.message} `,
            "error"
        );

    } finally {

        // Restore the button.
        submitButton.disabled = false;
        submitButton.textContent = "Register Course";
    }
});