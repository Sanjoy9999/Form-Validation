// ========================================
// STEP 1: Store form data here
// ========================================
let data = {};

// Get the form and all input fields
const form = document.getElementById("main-form");
const allInputs = Array.from(form.getElementsByClassName("evn-input"));
const requiredFields = Array.from(form.getElementsByClassName("reqField"));

// ========================================
// STEP 2: Helper functions for localStorage
// ========================================

// Get all saved users from browser storage
function loadUsers() {
  try {
    const users = localStorage.getItem("users");
    return users ? JSON.parse(users) : [];
  } catch {
    return [];
  }
}

// Save users to browser storage
function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

// Save or update a user
function saveUser(user) {
  const users = loadUsers();
  const existingIndex = users.findIndex(
    u => u.email?.toLowerCase() === user.email?.toLowerCase() && u.role === user.role
  );
  
  if (existingIndex >= 0) {
    users[existingIndex] = user; // Update existing user
  } else {
    users.push(user); // Add new user
  }
  
  saveUsers(users);
}

// Find a user by email and role
function findUser(email, role) {
  const users = loadUsers();
  return users.find(
    u => u.email?.toLowerCase() === email?.toLowerCase() && u.role === role
  );
}

// Save logged-in user (without password)
function setLoggedInUser(user) {
  const { password, ...safeUser } = user || {};
  localStorage.setItem("sessionUser", JSON.stringify(safeUser));
}

// Get logged-in user
function getLoggedInUser() {
  try {
    const user = localStorage.getItem("sessionUser");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

// ========================================
// STEP 3: Get the parent container for different field types
// ========================================
function getFieldContainer(input) {
  if (input.name === "gender") {
    // Radio: go up 3 levels
    return input.parentElement.parentElement.parentElement;
  }
  if (input.type === "checkbox") {
    // Checkbox: go up 2 levels
    return input.parentElement.parentElement;
  }
  // Default: just parent
  return input.parentElement;
}

// ========================================
// STEP 4: Show success (green border)
// ========================================
function showSuccess(input) {
  const container = getFieldContainer(input);
  container.classList.remove("error");
  container.classList.add("success");

  // Store the value in data object
  const key = input.name?.trim()?.toLowerCase();
  if (input.type === "checkbox") {
    data[key] = input.checked;
  } else {
    data[key] = input.value?.trim();
  }
}

// ========================================
// STEP 5: Show error (red border + message)
// ========================================
function showError(input, message) {
  const container = getFieldContainer(input);
  container.classList.add("error");
  container.classList.remove("success");

  // Find error message element
  const errorElement = container.querySelector(".field-error");
  
  // For checkbox and radio, show message as-is
  if (input.type === "checkbox" || input.type === "radio") {
    errorElement.textContent = message;
  } else {
    // For other fields, add field label before message
    const label = container.querySelector("label");
    const labelText = label ? label.textContent.split(":")[0] : "";
    errorElement.textContent = `${labelText} ${message}`;
  }
}

// ========================================
// STEP 6: Validate required fields
// ========================================
function checkIfRequired(input) {
  // Radio buttons checked separately
  if (input.type === "radio") return true;

  // Checkbox must be checked
  if (input.type === "checkbox") {
    if (!input.checked) {
      showError(input, "Terms and conditions must be accepted");
      return false;
    }
    return true;
  }

  // Dropdown must have a selection
  if (input.tagName === "SELECT") {
    if (!input.value || input.value.trim() === "") {
      showError(input, "Must be selected");
      return false;
    }
    return true;
  }

  // Other fields must not be empty
  const value = input.value?.trim();
  if (!value || value === "" || value === "Invalid Date") {
    showError(input, "Is Required");
    return false;
  }

  return true;
}

// ========================================
// STEP 7: Calculate age from date of birth
// ========================================
function calculateAge(birthDate) {
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }

  if (months < 0) {
    months += 12;
    years--;
  }

  return [years, months, days];
}

// ========================================
// STEP 8: Show age below DOB field
// ========================================
function showAge(input, ageText) {
  const container = input.parentElement;
  let ageDisplay = container.querySelector(".age-display");
  
  if (!ageDisplay) {
    ageDisplay = document.createElement("div");
    ageDisplay.className = "age-display";
    ageDisplay.style.marginTop = "3px";
    ageDisplay.style.color = "green";
    ageDisplay.style.fontSize = "20px";
    container.appendChild(ageDisplay);
  }
  
  ageDisplay.textContent = ageText;
}

// ========================================
// STEP 9: Main validation function
// ========================================
function validateField(input) {
  const value = input.value?.trim();
  const name = input.name?.trim()?.toLowerCase();
  const dataArg = input.getAttribute("data-arg");
  let isValid = false;

  // Check if field is required
  const hasReq = dataArg && dataArg.includes("req");
  if (hasReq) {
    isValid = checkIfRequired(input);
  }

  // Check alphabetic only (for name)
  if (dataArg && dataArg.includes("alpha")) {
    const onlyLetters = /^[a-zA-Z ]+$/;
    if (!onlyLetters.test(value)) {
      showError(input, "Only alphabetic characters are allowed");
      isValid = false;
    } else {
      isValid = true;
    }
  }

  // Check minimum length (3 characters)
  if (isValid && value.length > 0 && value.length < 3) {
    showError(input, "Must be 3 characters long");
    isValid = false;
  }

  // Validate phone (must be 10 digits)
  if (name === "phone") {
    if (value.length === 10) {
      isValid = true;
    } else {
      showError(input, "Must be 10 digits");
      isValid = false;
    }
  }

  // Validate email
  if (name === "email") {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
    if (emailPattern.test(value)) {
      isValid = true;
    } else {
      showError(input, "Is Invalid");
      isValid = false;
    }
  }

  // Validate password
  if (name === "password") {
    isValid = false;
    if (!/[A-Z]/.test(value)) {
      showError(input, "Must have one capital letter");
    } else if (!/[a-z]/.test(value)) {
      showError(input, "Must have one lowercase letter");
    } else if (!/\d/.test(value)) {
      showError(input, "Must have one number");
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      showError(input, "Must have one special character");
    } else if (value.length < 8) {
      showError(input, "Length must be at least 8 characters");
    } else {
      isValid = true;
    }
  }

  // Validate confirm password
  if (name === "cmf-password") {
    if (value === data?.password) {
      isValid = true;
    } else {
      showError(input, "Does not match");
      isValid = false;
    }
  }

  // Volume and color always valid
  if (name === "volume" || name === "color") {
    isValid = true;
  }

  // Validate checkbox
  if (name === "policy") {
    if (input.checked) {
      isValid = true;
    } else {
      showError(input, "Terms and conditions must be accepted");
      isValid = false;
    }
  }

  // Validate gender (radio group)
  if (name === "gender" && input.type === "radio") {
    const allGenderRadios = form.querySelectorAll('input[name="gender"]');
    const selectedRadio = Array.from(allGenderRadios).find(r => r.checked);
    
    if (!selectedRadio) {
      showError(input, "Gender must be selected");
      isValid = false;
    } else {
      const container = allGenderRadios[0].parentElement.parentElement.parentElement;
      container.classList.remove("error");
      container.classList.add("success");
      data["gender"] = selectedRadio.value.trim();
      isValid = true;
    }
  }

  // Validate date of birth (age 18-50)
  if (name === "dob") {
    const dobDate = new Date(value);
    
    if (isNaN(dobDate.getTime())) {
      showError(input, "Invalid Date");
      isValid = false;
    } else {
      const today = new Date();
      const minAge = new Date();
      minAge.setFullYear(today.getFullYear() - 18); // 2007
      
      const maxAge = new Date();
      maxAge.setFullYear(today.getFullYear() - 50); // 1975
      
      const dob = new Date(dobDate.getFullYear(), dobDate.getMonth(), dobDate.getDate());
      
      if (dob > minAge) {
        showError(input, "Minimum age is 18 years");
        isValid = false;
      } else if (dob < maxAge) {
        showError(input, "Maximum age is 50 years");
        isValid = false;
      } else {
        const [years, months, days] = calculateAge(dob);
        isValid = true;
        showSuccess(input);
        showAge(input, `${years} years ${months} months ${days} days`);
      }
    }
  }

  // Validate file upload
  if (name === "file") {
    const file = input.files[0];
    const maxSize = 1024 * 5; // 5MB
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    
    const fileSize = file.size / 1024;
    const fileType = file.type;
    
    isValid = false;
    
    if (!allowedTypes.includes(fileType)) {
      showError(input, `Must be ${allowedTypes.join(" ")}`);
    } else if (fileSize > maxSize) {
      showError(input, `Max size ${maxSize / 1024}MB`);
    } else {
      // Show preview
      const label = document.querySelector("#file-field label");
      const img = document.querySelector("#file-field label img");
      const pdfPreview = document.getElementById("pdf-preview");
      const fileUrl = URL.createObjectURL(file);
      
      if (fileType === "application/pdf") {
        label.classList.add("pdf");
        pdfPreview.src = fileUrl;
        img.src = "./upload_icon.svg";
      } else {
        label.classList.remove("pdf");
        img.src = fileUrl;
      }
      
      // Convert file to base64 for localStorage
      const reader = new FileReader();
      reader.onload = function(e) {
        data.fileData = e.target.result; // Store base64 data
        data.fileType = fileType; // Store file type
        data.fileName = file.name; // Store file name
      };
      reader.readAsDataURL(file);
      
      isValid = true;
    }
  }

  // Mark as success if valid (except DOB which handles it separately)
  if (isValid && name !== "dob") {
    if (name === "gender" && input.type === "radio") {
      const allGenderRadios = form.querySelectorAll('input[name="gender"]');
      const selectedRadio = Array.from(allGenderRadios).find(r => r.checked);
      if (selectedRadio) showSuccess(selectedRadio);
    } else {
      showSuccess(input);
    }
  }
}

// ========================================
// STEP 10: Add real-time validation
// ========================================
allInputs.forEach(input => {
  input.addEventListener("input", () => validateField(input));
  input.addEventListener("change", () => validateField(input));
});

// ========================================
// STEP 11: Handle form submit
// ========================================
form.addEventListener("submit", (e) => {
  e.preventDefault();

  // Validate all fields after click submit button
  allInputs.forEach(input => validateField(input));

  // Extra checks for select, checkbox, and radio
  const roleSelect = document.getElementById("role");
  if (roleSelect) {
    if (!roleSelect.value || roleSelect.value.trim() === "") {
      showError(roleSelect, "Must be selected");
    } else {
      showSuccess(roleSelect);
    }
  }

  const policy = document.getElementById("policy");
  if (policy) {
    if (!policy.checked) {
      showError(policy, "Terms and conditions must be accepted");
    } else {
      showSuccess(policy);
    }
  }

  const genderRadios = form.querySelectorAll('input[name="gender"]');
  if (genderRadios && genderRadios.length) {
    const checkedRadio = Array.from(genderRadios).find(r => r.checked);
    if (!checkedRadio) {
      // show error using the first radio element
      showError(genderRadios[0], "Gender must be selected");
    } else {
      showSuccess(checkedRadio);
    }
  }
  const successFields = Array.from(form.getElementsByClassName("success"));

  // Check if all required fields are successfully validated
  if (requiredFields.length === successFields.length) {
    const isRegistration = !!document.getElementById("name");

    if (isRegistration) {
      const user = { ...data };
      delete user["cmf-password"]; // not needed after match check
      delete user["file"]; // remove the File object (we have fileData instead)
      user.createdAt = new Date().toISOString();

      saveUser(user);
      alert("Registration successful. Please sign in.");
      window.location.href = "login.html";
      return;
    } else {
      const email = data?.email?.trim();
      const password = data?.password;
      const role = data?.role;

      const user = findUser(email, role);
      if (user && user.password === password) {
        setLoggedInUser(user);
        window.location.href = "details.html";
      } else {
        alert("Email, password or role does not match.");
      }
    }
  }
});


// ========================================
// STEP 12: Handle form reset
// ========================================
// Reset handler: clear previews, UI states, and stored data
form.addEventListener("reset", () => {
  // Run after native reset settles
  setTimeout(() => {
    // Clear file input and preview
    const fileInput = document.getElementById("file");
    if (fileInput) fileInput.value = "";

    const labelElm = document.querySelector("#file-field label");
    if (labelElm) labelElm.classList.remove("pdf");

    const imgElm = document.querySelector("#file-field label img");
    if (imgElm) imgElm.src = "./upload_icon.svg";

    const pdfPreview = document.getElementById("pdf-preview");
    if (pdfPreview) pdfPreview.src = "";

    // Remove age display if present
    const dobInput = document.getElementById("dob");
    const ageSpan = dobInput?.parentElement?.querySelector(".age-display");
    if (ageSpan) ageSpan.remove();

    // Clear validation UI states
    Array.from(form.getElementsByClassName("success"))
      .forEach(el => el.classList.remove("success"));
    Array.from(form.getElementsByClassName("error"))
      .forEach(el => el.classList.remove("error"));

    // Reset error messages to placeholder
    Array.from(form.getElementsByClassName("field-error"))
      .forEach(el => el.textContent = "Error Here");

    // Clear collected data
    data = {};
  }, 0);
});

// ========================================
// STEP 13: Password Toggle (Show/Hide)
// ========================================

/**
 * Toggle password visibility for password field
 */
const passwordInput = document.getElementById("password");
const hidePasswordIcon = document.getElementById("hide-password");
const showPasswordIcon = document.getElementById("show-password");

if (hidePasswordIcon && showPasswordIcon && passwordInput) {
  // Toggle for close-eye (hide) icon - show password when clicked
  hidePasswordIcon.addEventListener("click", () => {
    passwordInput.type = "text"; // Show password
    hidePasswordIcon.style.display = "none"; // Hide close-eye
    showPasswordIcon.style.display = "block"; // Show open-eye
  });

  // Toggle for open-eye (show) icon - hide password when clicked
  showPasswordIcon.addEventListener("click", () => {
    passwordInput.type = "password"; // Hide password
    showPasswordIcon.style.display = "none"; // Hide open-eye
    hidePasswordIcon.style.display = "block"; // Show close-eye
  });
}

/**
 * Toggle password visibility for confirm password field
 */
const cmfPasswordInput = document.getElementById("cmf-password");
const cmfHidePasswordIcon = document.getElementById("cmf-hide-password");
const cmfShowPasswordIcon = document.getElementById("cmf-show-password");

if (cmfHidePasswordIcon && cmfShowPasswordIcon && cmfPasswordInput) {
  // Toggle for close-eye (hide) icon - show password when clicked
  cmfHidePasswordIcon.addEventListener("click", () => {
    cmfPasswordInput.type = "text"; // Show password
    cmfHidePasswordIcon.style.display = "none"; // Hide close-eye
    cmfShowPasswordIcon.style.display = "block"; // Show open-eye
  });

  // Toggle for open-eye (show) icon - hide password when clicked
  cmfShowPasswordIcon.addEventListener("click", () => {
    cmfPasswordInput.type = "password"; // Hide password
    cmfShowPasswordIcon.style.display = "none"; // Hide open-eye
    cmfHidePasswordIcon.style.display = "block"; // Show close-eye
  });
}

